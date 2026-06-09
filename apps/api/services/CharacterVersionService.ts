import { Types } from 'mongoose';
import { connectToDatabase } from '../lib/mongodb';
import { CharacterModel } from '../models/Character';
import { CharacterVersionModel } from '../models/CharacterVersion';
import { SnapshotDiffService } from './SnapshotDiffService';

type CreateDraftInput = {
  characterId: string;
  gameSystemId: string;
  snapshot: unknown;
  changeSummary?: string;
  previousVersionId?: string | null;
  createdBy: string;
};

type UpdateDraftInput = {
  characterId: string;
  snapshot: unknown;
  changeSummary?: string;
};

export class CharacterVersionService {
  private readonly diffService = new SnapshotDiffService();

  async createDraft(input: CreateDraftInput) {
    await connectToDatabase();

    const latestVersion = await CharacterVersionModel.findOne({
      characterId: input.characterId,
      status: 'published',
    }).sort({ versionNumber: -1 });

    const draft = await CharacterVersionModel.create({
      characterId: input.characterId,
      gameSystemId: input.gameSystemId,
      versionNumber: (latestVersion?.versionNumber ?? 0) + 1,
      status: 'draft',
      snapshot: input.snapshot,
      changeSummary: input.changeSummary ?? '',
      previousVersionId: input.previousVersionId ?? latestVersion?._id ?? null,
      createdBy: input.createdBy,
    });

    await CharacterModel.findByIdAndUpdate(input.characterId, {
      draftVersionId: draft._id,
      updatedAt: new Date(),
    });

    return draft;
  }

  async updateDraft(input: UpdateDraftInput) {
    await connectToDatabase();

    const character = await CharacterModel.findById(input.characterId);
    if (!character?.draftVersionId) {
      throw new Error('Draft version not found for character.');
    }

    const draft = await CharacterVersionModel.findOneAndUpdate(
      {
        _id: character.draftVersionId,
        characterId: input.characterId,
        status: 'draft',
      },
      {
        $set: {
          snapshot: input.snapshot,
          changeSummary: input.changeSummary ?? '',
        },
      },
      { new: true },
    );

    if (!draft) {
      throw new Error('Only draft versions can be edited.');
    }

    await CharacterModel.findByIdAndUpdate(input.characterId, {
      updatedAt: new Date(),
    });

    return draft;
  }

  async getDraftOrCreate(input: CreateDraftInput) {
    await connectToDatabase();

    const character = await CharacterModel.findById(input.characterId);
    if (!character) {
      throw new Error('Character not found.');
    }

    if (character.draftVersionId) {
      const draft = await CharacterVersionModel.findOne({
        _id: character.draftVersionId,
        status: 'draft',
      });

      if (draft) {
        return draft;
      }
    }

    return this.createDraft(input);
  }

  async publishDraft(characterId: string, changeSummary?: string) {
    await connectToDatabase();

    const character = await CharacterModel.findById(characterId);
    if (!character?.draftVersionId) {
      throw new Error('Draft version not found for character.');
    }

    const draft = await CharacterVersionModel.findOneAndUpdate(
      {
        _id: character.draftVersionId,
        status: 'draft',
      },
      {
        $set: {
          status: 'published',
          changeSummary: changeSummary ?? '',
          publishedAt: new Date(),
        },
      },
      { new: true },
    );

    if (!draft) {
      throw new Error('Only draft versions can be published.');
    }

    await CharacterModel.findByIdAndUpdate(characterId, {
      currentVersionId: draft._id,
      draftVersionId: null,
      updatedAt: new Date(),
    });

    return draft;
  }

  async listVersions(characterId: string) {
    await connectToDatabase();

    return CharacterVersionModel.find({ characterId }).sort({
      versionNumber: -1,
      createdAt: -1,
    });
  }

  async getVersion(characterId: string, versionId: string) {
    await connectToDatabase();

    return CharacterVersionModel.findOne({
      _id: versionId,
      characterId,
    });
  }

  async restoreVersion(characterId: string, versionId: string, createdBy: string, publish = false) {
    await connectToDatabase();

    const character = await CharacterModel.findById(characterId);
    const sourceVersion = await CharacterVersionModel.findOne({
      _id: versionId,
      characterId,
    });

    if (!character || !sourceVersion) {
      throw new Error('Character version not found.');
    }

    const draft = await this.createDraft({
      characterId,
      gameSystemId: String(character.gameSystemId),
      snapshot: sourceVersion.snapshot,
      changeSummary: `Restored from version ${sourceVersion.versionNumber}.`,
      previousVersionId: character.currentVersionId ? String(character.currentVersionId) : null,
      createdBy,
    });

    if (publish) {
      return this.publishDraft(characterId, draft.changeSummary);
    }

    return draft;
  }

  async diffVersions(characterId: string, fromVersionId: string, toVersionId: string) {
    await connectToDatabase();

    const [fromVersion, toVersion] = await Promise.all([
      CharacterVersionModel.findOne({ _id: new Types.ObjectId(fromVersionId), characterId }),
      CharacterVersionModel.findOne({ _id: new Types.ObjectId(toVersionId), characterId }),
    ]);

    if (!fromVersion || !toVersion) {
      throw new Error('Both versions must exist for this character.');
    }

    return {
      fromVersionId,
      toVersionId,
      operations: this.diffService.compare(fromVersion.snapshot, toVersion.snapshot),
    };
  }
}
