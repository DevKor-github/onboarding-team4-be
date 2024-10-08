import {
  ForbiddenException,
  HttpException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Model, ObjectId, Types } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import { Chat } from 'src/chat/model/chat.schema';
import { Room } from 'src/chat/model/room.schema';
import { User } from 'src/chat/model/user.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(Chat.name) private chatModel: Model<Chat>,
    @InjectModel(Room.name) private roomModel: Model<Room>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}
  async getUserObjId(id: string): Promise<Types.ObjectId> {
    const user = await this.userModel.findOne({ userId: id }).exec();
    if (!user) throw new NotFoundException();
    return user._id;
  }
  async idJungbok(id: string): Promise<boolean> {
    //TRUE : 가능, FALSE: 불가능
    const user = await this.userModel.findOne({ userId: id }).exec();
    if (user) return false;
    else return true;
  }
  async profileimg(id: string): Promise<string> {
    const user = await this.userModel.findOne({ userId: id }).exec();
    if (!user) throw new NotFoundException();
    return user.profileImage;
  }
  async getUserChatrooms(userId: Types.ObjectId) {
    const rooms = await this.roomModel.find({ userIds: userId }).exec();
    const roomIds = rooms.map((room) => room._id);
    return roomIds;
  }
  async getChatsByRoomId(userId: Types.ObjectId, roomId: Types.ObjectId) {
    const room = await this.roomModel.findById(roomId).exec();
    if (!room) throw new NotFoundException();
    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new ForbiddenException('');

    const chats = await this.chatModel.find({ roomId: roomId }).exec();
    const res = chats.map((chat) => ({
      content: chat.content,
      time: chat.time.toString(),
      contentType: chat.contentType,
    }));
    return res;
  }
  async getUsersByRoomId(userId: Types.ObjectId, roomId: Types.ObjectId) {
    const room = await this.roomModel.findById(roomId).exec();
    if (!room) throw new NotFoundException('Room Not found');

    const user = await this.userModel.findById(userId).exec();
    if (!user) throw new ForbiddenException('');

    const users = await this.userModel
      .find({
        _id: { $in: room.userIds },
      })
      .exec();

    return users
      .filter((u) => !u._id.equals(userId))
      .map((u) => ({
        userId: u.userId,
        profileImage: u.profileImage,
        userNick: u.userNick,
      }));
  }
  async gethashedPasswordByUserId(userId: string) {
    const user = await this.userModel.findOne({ userId }).exec();
    if (!user) throw new UnauthorizedException('');
    const res = user.password;
    return res;
  }
  async getUserInfoByUserId(userId: string) {
    const user = await this.userModel.findOne({ userId: userId }).exec();
    return user;
  }
  async getuserIdByObjUserId(userId: Types.ObjectId) {
    const user = await this.userModel.findById(userId).exec();
    return user.userId;
  }
  async getInitialScreen(userId: Types.ObjectId) {
    const roomIds = await this.getUserChatrooms(userId);

    const roomDataPromises = roomIds.map(async (roomId) => {
      const users = await this.getUsersByRoomId(userId, roomId);
      return {
        _id: roomId,
        memberList: users.map((user) => ({
          _id: user.userId,
          userNick: user.userNick,
          profileImage: user.profileImage,
        })),
      };
    });
    const res = await Promise.all(roomDataPromises);

    return res;
  }
}
