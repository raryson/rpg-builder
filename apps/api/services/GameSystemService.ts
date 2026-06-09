import { connectToDatabase } from '../lib/mongodb';
import { starWarsSagaDefinition } from '../game-systems/definitions/star-wars-saga';
import { GameSystemModel } from '../models/GameSystem';

export class GameSystemService {
  async ensureStarWarsSagaSystem() {
    await connectToDatabase();

    return GameSystemModel.findOneAndUpdate(
      { slug: starWarsSagaDefinition.slug },
      { $set: starWarsSagaDefinition },
      { new: true, upsert: true },
    );
  }

  async findBySlug(slug: string) {
    await connectToDatabase();
    return GameSystemModel.findOne({ slug });
  }

  async getById(gameSystemId: string) {
    await connectToDatabase();
    return GameSystemModel.findById(gameSystemId);
  }

  async list() {
    await connectToDatabase();
    return GameSystemModel.find({}).sort({ name: 1 });
  }
}
