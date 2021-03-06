import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, isValidObjectId } from 'mongoose';
import { Users, UsersPublic } from './users.interface';
import { UpdateInfoDto } from './dto/update-info.dto';
import { UpdateAvatarDto } from './dto/update-avatar.dto';
import { UpdateCcDto } from './dto/update-cc.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { hashSync } from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel('Users') private readonly usersModel: Model<Users>,
  ) {}

  async createAdmin(createAdminDto: CreateAdminDto): Promise<UsersPublic> {
    if (await this.usersModel.exists({ username: createAdminDto.username })) {
      return null;
    }

    createAdminDto.password = hashSync(createAdminDto.password, 10);
    const createdAdmin = new this.usersModel(createAdminDto);
    await createdAdmin.save();

    return await this.usersModel
      .findOne({ username: createAdminDto.username })
      .select('-password')
      .exec();
  }

  async upsertLiffUser(liffUserProfile: {
    displayName: string;
    userId: string; // will save to password
    pictureUrl: string;
    statusMessage: string;
  }): Promise<UsersPublic> {
    if (
      await this.usersModel.exists({
        password: liffUserProfile.userId,
        admin: false,
      })
    ) {
      return await this.usersModel
        .findOneAndUpdate(
          {
            password: liffUserProfile.userId,
            admin: false,
          },
          {
            avatar: liffUserProfile.pictureUrl,
            info: liffUserProfile.statusMessage,
          },
          { new: true },
        )
        .select('-password')
        .exec();
    }

    const createdLiffUser = new this.usersModel({
      username: liffUserProfile.displayName,
      password: liffUserProfile.userId,
      avatar: liffUserProfile.pictureUrl,
      info: liffUserProfile.statusMessage,
    });
    await createdLiffUser.save();

    return await this.usersModel
      .findOne({
        admin: false,
        password: liffUserProfile.userId,
      })
      .select('-password')
      .exec();
  }

  async findOneByUsername(username: string): Promise<Users> {
    return await this.usersModel.findOne({ username: username }).exec();
  }

  async findOneByID(id: string): Promise<Users> {
    return await this.usersModel.findOne({ _id: id }).exec();
  }

  async findOneByIDPublic(id: string): Promise<UsersPublic> {
    //This function using on API, not include password in user profile
    if (!isValidObjectId(id)) {
      return null;
    }
    return await this.usersModel
      .findOne({ _id: id })
      .select('-password')
      .exec();
  }

  async findAllPublic(): Promise<UsersPublic[]> {
    //This function using on API, not include password in all user profile
    return await this.usersModel.find().select('-password').exec();
  }

  async update(
    id: string,
    dto: UpdateAvatarDto | UpdateInfoDto | UpdateCcDto,
  ): Promise<UsersPublic> {
    return await this.usersModel
      .findByIdAndUpdate(id, dto, { new: true })
      .select('-password')
      .exec();
  }
}
