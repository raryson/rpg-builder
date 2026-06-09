import { connectToDatabase } from '../lib/mongodb';
import {
  StarWarsDroidSystemModel,
  StarWarsEquipmentModel,
  StarWarsFeatModel,
  StarWarsForcePowerModel,
  StarWarsForceSecretModel,
  StarWarsForceTechniqueModel,
  StarWarsForceTraditionModel,
  StarWarsHeroicClassModel,
  StarWarsPrestigeClassModel,
  StarWarsSkillModel,
  StarWarsSpeciesModel,
  StarWarsTalentModel,
  StarWarsVehicleModel,
} from '../models/star-wars-saga-catalogs';
import { seedStarWarsSagaCatalogs } from '../seeds/star-wars-saga';

export class StarWarsSagaCatalogService {
  async seedInitialCatalogs() {
    await seedStarWarsSagaCatalogs();
  }

  async listCatalogs() {
    await connectToDatabase();
    await this.seedInitialCatalogs();

    const [
      species,
      heroicClasses,
      prestigeClasses,
      skills,
      feats,
      talents,
      forcePowers,
      forceTechniques,
      forceSecrets,
      forceTraditions,
      equipment,
      vehicles,
      droidSystems,
    ] = await Promise.all([
      StarWarsSpeciesModel.find({}).sort({ name: 1 }).lean(),
      StarWarsHeroicClassModel.find({}).sort({ name: 1 }).lean(),
      StarWarsPrestigeClassModel.find({}).sort({ name: 1 }).lean(),
      StarWarsSkillModel.find({}).sort({ name: 1 }).lean(),
      StarWarsFeatModel.find({}).sort({ name: 1 }).lean(),
      StarWarsTalentModel.find({}).sort({ tree: 1, name: 1 }).lean(),
      StarWarsForcePowerModel.find({}).sort({ name: 1 }).lean(),
      StarWarsForceTechniqueModel.find({}).sort({ name: 1 }).lean(),
      StarWarsForceSecretModel.find({}).sort({ name: 1 }).lean(),
      StarWarsForceTraditionModel.find({}).sort({ name: 1 }).lean(),
      StarWarsEquipmentModel.find({}).sort({ type: 1, name: 1 }).lean(),
      StarWarsVehicleModel.find({}).sort({ name: 1 }).lean(),
      StarWarsDroidSystemModel.find({}).sort({ name: 1 }).lean(),
    ]);

    return {
      species,
      heroicClasses,
      prestigeClasses,
      skills,
      feats,
      talents,
      forcePowers,
      forceTechniques,
      forceSecrets,
      forceTraditions,
      equipment,
      vehicles,
      droidSystems,
    };
  }
}
