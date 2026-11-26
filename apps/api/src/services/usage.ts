import { UsageResponse } from '@translator/shared';
import { getUsage as getDeepLUsage } from '../providers/deepl';

export async function getUsage(): Promise<UsageResponse> {
  const { character_count, character_limit } = await getDeepLUsage();

  return {
    usedCharacters: character_count,
    limitCharacters: character_limit,
    remainingCharacters: Math.max(character_limit - character_count, 0),
  };
}
