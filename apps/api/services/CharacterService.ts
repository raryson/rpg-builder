import { connectToDatabase } from '../lib/mongodb';
import { CharacterModel } from '../models/Character';
import { createDefaultStarWarsSagaSnapshot } from '../types/snapshots/star-wars-saga';
import { CharacterCalculationService } from './CharacterCalculationService';
import { CharacterValidationService } from './CharacterValidationService';
import { CharacterVersionService } from './CharacterVersionService';
import { GameSystemService } from './GameSystemService';

type CreateCharacterInput = {
  ownerId: string;
  campaignId?: string | null;
  gameSystemSlug?: string;
  name: string;
  snapshot?: unknown;
};

type UpdateDraftInput = {
  characterId: string;
  snapshot: unknown;
  changeSummary?: string;
};

export class CharacterService {
  private readonly gameSystemService = new GameSystemService();
  private readonly versionService = new CharacterVersionService();
  private readonly validationService = new CharacterValidationService();
  private readonly calculationService = new CharacterCalculationService();

  async create(input: CreateCharacterInput) {
    await connectToDatabase();

    const gameSystem =
      input.gameSystemSlug === 'star-wars-saga' || !input.gameSystemSlug
        ? await this.gameSystemService.ensureStarWarsSagaSystem()
        : await this.gameSystemService.findBySlug(input.gameSystemSlug);

    if (!gameSystem) {
      throw new Error('Game system not found.');
    }

    const gameSystemSlug = gameSystem.slug as string;
    const baseSnapshot = input.snapshot ?? createDefaultStarWarsSagaSnapshot(input.name);
    const calculatedSnapshot = this.calculationService.calculateDerivedFields(gameSystemSlug, baseSnapshot);
    const validation = this.validationService.validate(gameSystemSlug, calculatedSnapshot);

    if (!validation.valid) {
      throw new Error(validation.issues.map((issue) => issue.message).join(' '));
    }

    const character = await CharacterModel.create({
      ownerId: input.ownerId,
      campaignId: input.campaignId ?? null,
      gameSystemId: gameSystem._id,
      name: input.name,
    });

    const draft = await this.versionService.createDraft({
      characterId: String(character._id),
      gameSystemId: String(gameSystem._id),
      snapshot: calculatedSnapshot,
      changeSummary: 'Initial draft.',
      createdBy: input.ownerId,
    });

    return {
      character,
      draft,
    };
  }

  async list(ownerId: string) {
    await connectToDatabase();

    return CharacterModel.find({
      ownerId,
      archivedAt: null,
    })
      .populate('currentVersionId')
      .populate('draftVersionId')
      .sort({ updatedAt: -1 });
  }

  async get(characterId: string) {
    await connectToDatabase();

    return CharacterModel.findById(characterId)
      .populate('gameSystemId')
      .populate('currentVersionId')
      .populate('draftVersionId');
  }

  async updateDraft(input: UpdateDraftInput) {
    await connectToDatabase();

    const character = await CharacterModel.findById(input.characterId).populate<{
      gameSystemId: { _id: unknown; slug: string };
    }>('gameSystemId');

    if (!character) {
      throw new Error('Character not found.');
    }

    const calculatedSnapshot = this.calculationService.calculateDerivedFields(
      character.gameSystemId.slug,
      input.snapshot,
    );
    const validation = this.validationService.validate(character.gameSystemId.slug, calculatedSnapshot);

    if (!validation.valid) {
      throw new Error(validation.issues.map((issue) => issue.message).join(' '));
    }

    await this.versionService.getDraftOrCreate({
      characterId: input.characterId,
      gameSystemId: String(character.gameSystemId._id),
      snapshot: calculatedSnapshot,
      changeSummary: input.changeSummary,
      previousVersionId: character.currentVersionId ? String(character.currentVersionId) : null,
      createdBy: character.ownerId,
    });

    return this.versionService.updateDraft({
      ...input,
      snapshot: calculatedSnapshot,
    });
  }

  async publish(characterId: string, changeSummary?: string) {
    return this.versionService.publishDraft(characterId, changeSummary);
  }

  async listVersions(characterId: string) {
    return this.versionService.listVersions(characterId);
  }

  async getVersion(characterId: string, versionId: string) {
    return this.versionService.getVersion(characterId, versionId);
  }

  async restoreVersion(characterId: string, versionId: string, createdBy: string, publish = false) {
    return this.versionService.restoreVersion(characterId, versionId, createdBy, publish);
  }

  async diffVersions(characterId: string, fromVersionId: string, toVersionId: string) {
    return this.versionService.diffVersions(characterId, fromVersionId, toVersionId);
  }
}
