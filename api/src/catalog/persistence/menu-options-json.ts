import { MenuOptionDefinition } from '../domain/menu-option-definition';
import { Prisma } from '@/generated/prisma/client';

export function toPrismaMenuOptions(
  definitions: readonly MenuOptionDefinition[],
): Prisma.InputJsonValue {
  return definitions.map((definition): Prisma.InputJsonObject => {
    if (definition.choices !== undefined) {
      return {
        name: definition.name,
        choices: definition.choices.map((choice) => ({
          name: choice.name,
          extraMinor: choice.extraMinor,
        })),
      };
    }

    return {
      name: definition.name,
      extraMinor: definition.extraMinor,
    };
  });
}
