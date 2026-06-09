import { connectToDatabase } from '../lib/mongodb';
import { WebUserModel } from '../models/WebUser';

export type SaveGoogleUserInput = {
  providerId: string;
  email: string;
  emailVerified: boolean;
  name: string;
  picture?: string;
};

export class WebUserService {
  async saveGoogleUser(input: SaveGoogleUserInput) {
    await connectToDatabase();

    return WebUserModel.findOneAndUpdate(
      {
        provider: 'google',
        providerId: input.providerId,
      },
      {
        $set: {
          email: input.email,
          emailVerified: input.emailVerified,
          name: input.name || input.email,
          picture: input.picture ?? '',
          lastLoginAt: new Date(),
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );
  }
}
