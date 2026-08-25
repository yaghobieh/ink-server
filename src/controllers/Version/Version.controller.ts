import { getVersionInfo } from '../../utils/version.utils.js';
import type { VersionInfo } from '../../types/version.types.js';

export const getVersion = (): VersionInfo => getVersionInfo();
