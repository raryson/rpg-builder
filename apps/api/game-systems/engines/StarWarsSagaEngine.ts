import type {
  EngineSummary,
  EngineValidationIssue,
  EngineValidationResult,
  GameSystemEngine,
} from './GameSystemEngine';
import type { SagaAbilityKey, SagaDefense, StarWarsSagaSnapshot } from '../../types/snapshots/star-wars-saga';
import { sagaAbilityKeys } from '../../types/snapshots/star-wars-saga';

const defenseAbility: Record<keyof StarWarsSagaSnapshot['combat']['defenses'], SagaAbilityKey> = {
  reflex: 'dexterity',
  fortitude: 'constitution',
  will: 'wisdom',
};

function result(issues: EngineValidationIssue[]): EngineValidationResult {
  return {
    valid: issues.every((issue) => issue.severity !== 'error'),
    issues,
  };
}

function sumDefense(defense: SagaDefense) {
  return (
    defense.baseValue +
    defense.heroicLevelBonus +
    defense.classBonus +
    defense.abilityModifier +
    defense.equipmentBonus +
    defense.miscellaneousBonus +
    defense.temporaryBonus
  );
}

export class StarWarsSagaEngine implements GameSystemEngine<StarWarsSagaSnapshot> {
  readonly slug = 'star-wars-saga';

  calculateAbilityModifier(score: number) {
    return Math.floor((score - 10) / 2);
  }

  calculateTotalLevel(snapshot: StarWarsSagaSnapshot) {
    return snapshot.classes.levels.reduce((total, classLevel) => total + classLevel.level, 0);
  }

  calculateBaseAttackBonus(snapshot: StarWarsSagaSnapshot) {
    return snapshot.classes.levels.reduce((total, classLevel) => {
      const progression = classLevel.classSlug === 'nobre' || classLevel.classSlug === 'fora-da-lei' ? 0.75 : 1;
      return total + Math.floor(classLevel.level * progression);
    }, 0);
  }

  calculateDefenses(snapshot: StarWarsSagaSnapshot) {
    const totalLevel = this.calculateTotalLevel(snapshot);
    const heroicLevelBonus = totalLevel;

    return Object.fromEntries(
      Object.entries(snapshot.combat.defenses).map(([key, defense]) => {
        const typedKey = key as keyof StarWarsSagaSnapshot['combat']['defenses'];
        const abilityKey = defenseAbility[typedKey];
        const abilityModifier = snapshot.abilities[abilityKey].modifier ?? 0;
        const nextDefense = {
          ...defense,
          heroicLevelBonus,
          abilityModifier,
          classBonus: snapshot.classes.classDefenseBonuses[typedKey],
        };
        return [typedKey, { ...nextDefense, total: sumDefense(nextDefense) }];
      }),
    ) as StarWarsSagaSnapshot['combat']['defenses'];
  }

  calculateHitPoints(snapshot: StarWarsSagaSnapshot) {
    return snapshot.combat.hitPoints.maximum;
  }

  calculateDamageThreshold(snapshot: StarWarsSagaSnapshot) {
    const fortitude = snapshot.combat.defenses.fortitude.total ?? 10;
    return fortitude;
  }

  calculateSkillModifier(snapshot: StarWarsSagaSnapshot, skill: StarWarsSagaSnapshot['skills'][number]) {
    const totalLevel = this.calculateTotalLevel(snapshot);
    const halfLevelBonus = Math.floor(totalLevel / 2);
    const abilityModifier = skill.abilityModifier ?? 0;
    const trainingBonus = skill.trained ? 5 : 0;
    const focusBonus = skill.focused ? 5 : 0;

    return {
      ...skill,
      halfLevelBonus,
      trainingBonus,
      focusBonus,
      total:
        abilityModifier +
        halfLevelBonus +
        trainingBonus +
        focusBonus +
        skill.armorPenalty +
        skill.miscellaneousBonus +
        skill.temporaryBonus,
    };
  }

  calculateInitiative(snapshot: StarWarsSagaSnapshot) {
    const initiative = snapshot.skills.find((skill) => skill.skillSlug === 'iniciativa');
    return initiative?.total ?? snapshot.abilities.dexterity.modifier ?? 0;
  }

  calculateCarryingCapacity(snapshot: StarWarsSagaSnapshot) {
    const strength = snapshot.abilities.strength.totalValue ?? 10;
    return strength * 5;
  }

  validateFeatPrerequisites(_snapshot: StarWarsSagaSnapshot) {
    return result([]);
  }

  validateTalentPrerequisites(_snapshot: StarWarsSagaSnapshot) {
    return result([]);
  }

  validatePrestigeClassPrerequisites(_snapshot: StarWarsSagaSnapshot) {
    return result([]);
  }

  validateForcePowerPrerequisites(snapshot: StarWarsSagaSnapshot) {
    const issues: EngineValidationIssue[] = [];
    if (!snapshot.force.forceSensitivity && snapshot.force.forcePowers.length > 0) {
      issues.push({
        path: 'force.forcePowers',
        message: 'Poderes da Forca exigem sensibilidade a Forca.',
        severity: 'error',
      });
    }
    return result(issues);
  }

  validateCharacterCreation(snapshot: StarWarsSagaSnapshot) {
    const issues: EngineValidationIssue[] = [];

    if (!snapshot.identity.characterName.trim()) {
      issues.push({ path: 'identity.characterName', message: 'Nome do personagem e obrigatorio.', severity: 'error' });
    }

    if (!snapshot.species.slug) {
      issues.push({ path: 'species.slug', message: 'Especie deve ser selecionada do catalogo.', severity: 'error' });
    }

    if (snapshot.classes.levels.length === 0) {
      issues.push({ path: 'classes.levels', message: 'Ao menos uma classe deve ser selecionada.', severity: 'error' });
    }

    for (const abilityKey of sagaAbilityKeys) {
      const ability = snapshot.abilities[abilityKey];
      if (ability.baseValue < 1) {
        issues.push({
          path: `abilities.${abilityKey}.baseValue`,
          message: 'Valor base de habilidade deve ser maior que zero.',
          severity: 'error',
        });
      }
    }

    return result(issues);
  }

  validateLevelUp(previousSnapshot: StarWarsSagaSnapshot | null, nextSnapshot: StarWarsSagaSnapshot) {
    const issues: EngineValidationIssue[] = [];
    if (previousSnapshot && this.calculateTotalLevel(nextSnapshot) < this.calculateTotalLevel(previousSnapshot)) {
      issues.push({ path: 'classes.levels', message: 'Nivel total diminuiu em relacao a versao anterior.', severity: 'warning' });
    }
    return result(issues);
  }

  validateSheet(snapshot: StarWarsSagaSnapshot): EngineValidationResult {
    const checks = [
      this.validateCharacterCreation(snapshot),
      this.validateFeatPrerequisites(snapshot),
      this.validateTalentPrerequisites(snapshot),
      this.validatePrestigeClassPrerequisites(snapshot),
      this.validateForcePowerPrerequisites(snapshot),
    ];
    return result(checks.flatMap((check) => check.issues));
  }

  calculateDerivedFields(snapshot: StarWarsSagaSnapshot): StarWarsSagaSnapshot {
    const abilities = Object.fromEntries(
      Object.entries(snapshot.abilities).map(([key, value]) => {
        const totalValue = value.baseValue + value.speciesModifier + value.levelModifier + value.temporaryModifier;
        return [key, { ...value, totalValue, modifier: this.calculateAbilityModifier(totalValue) }];
      }),
    ) as StarWarsSagaSnapshot['abilities'];

    const withAbilities = { ...snapshot, abilities };
    const totalLevel = Math.max(1, this.calculateTotalLevel(withAbilities));
    const heroicLevel = withAbilities.classes.levels
      .filter((classLevel) => classLevel.classType === 'heroic')
      .reduce((total, classLevel) => total + classLevel.level, 0);
    const prestigeLevel = totalLevel - heroicLevel;
    const baseAttackBonus = this.calculateBaseAttackBonus(withAbilities);
    const defenses = this.calculateDefenses(withAbilities);
    const skills = withAbilities.skills.map((skill) => this.calculateSkillModifier(withAbilities, skill));
    const initiative = skills.find((skill) => skill.skillSlug === 'iniciativa')?.total ?? abilities.dexterity.modifier ?? 0;
    const perception = skills.find((skill) => skill.skillSlug === 'percepcao')?.total ?? abilities.wisdom.modifier ?? 0;
    const reflex = defenses.reflex.total ?? 10;
    const fortitude = defenses.fortitude.total ?? 10;

    return {
      ...withAbilities,
      classes: {
        ...withAbilities.classes,
        totalLevel,
        heroicLevel,
        prestigeLevel,
        baseAttackBonus,
      },
      combat: {
        ...withAbilities.combat,
        defenses,
        damageThreshold: this.calculateDamageThreshold({ ...withAbilities, combat: { ...withAbilities.combat, defenses } }),
        initiative,
        perception,
        baseAttackBonus,
        grappleModifier: baseAttackBonus + (abilities.strength.modifier ?? 0),
        meleeAttackBonus: baseAttackBonus + (abilities.strength.modifier ?? 0),
        rangedAttackBonus: baseAttackBonus + (abilities.dexterity.modifier ?? 0),
      },
      skills,
      equipment: {
        ...withAbilities.equipment,
        carryingCapacity: this.calculateCarryingCapacity(withAbilities),
      },
      force: {
        ...withAbilities.force,
        forcePoints: withAbilities.combat.forcePoints,
        destinyPoints: withAbilities.combat.destinyPoints,
        darkSideScore: withAbilities.combat.darkSideScore,
      },
      calculatedAt: new Date().toISOString(),
    };
  }

  validatePrerequisites(snapshot: StarWarsSagaSnapshot): EngineValidationResult {
    return result([
      ...this.validateFeatPrerequisites(snapshot).issues,
      ...this.validateTalentPrerequisites(snapshot).issues,
      ...this.validatePrestigeClassPrerequisites(snapshot).issues,
      ...this.validateForcePowerPrerequisites(snapshot).issues,
    ]);
  }

  validateProgression(
    previousSnapshot: StarWarsSagaSnapshot | null,
    nextSnapshot: StarWarsSagaSnapshot,
  ): EngineValidationResult {
    return this.validateLevelUp(previousSnapshot, nextSnapshot);
  }

  generateCharacterSummary(snapshot: StarWarsSagaSnapshot): EngineSummary {
    return this.generateSummary(snapshot);
  }

  generateSummary(snapshot: StarWarsSagaSnapshot): EngineSummary {
    const totalLevel = snapshot.classes.totalLevel ?? this.calculateTotalLevel(snapshot);
    return {
      title: snapshot.identity.characterName,
      subtitle: `${snapshot.species.slug} - nivel ${totalLevel}`,
      lines: [
        `Defesas Ref ${snapshot.combat.defenses.reflex.total ?? 10} Fort ${snapshot.combat.defenses.fortitude.total ?? 10} Von ${
          snapshot.combat.defenses.will.total ?? 10
        }`,
        `PV ${snapshot.combat.hitPoints.current}/${snapshot.combat.hitPoints.maximum}`,
        `BBA ${snapshot.combat.baseAttackBonus ?? 0} - Creditos ${snapshot.equipment.credits}`,
      ],
    };
  }

  prepareForExport(snapshot: StarWarsSagaSnapshot): Record<string, unknown> {
    return {
      system: this.slug,
      summary: this.generateSummary(snapshot),
      snapshot,
    };
  }
}
