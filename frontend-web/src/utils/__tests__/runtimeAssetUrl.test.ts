import { api } from '../../services/api';
import { resolveRuntimeAssetUrl } from '../runtimeAssetUrl';

jest.mock('../../services/api', () => ({
  __esModule: true,
  api: {
    defaults: {
      baseURL: '',
    },
  },
}));

const apiMock = api as unknown as { defaults: { baseURL?: string } };

describe('resolveRuntimeAssetUrl', () => {
  beforeEach(() => {
    apiMock.defaults.baseURL = '';
  });

  it('keeps absolute urls untouched', () => {
    expect(resolveRuntimeAssetUrl('https://cdn.exemplo.com/logo.svg')).toBe(
      'https://cdn.exemplo.com/logo.svg',
    );
  });

  it('resolves uploads path against api base url', () => {
    apiMock.defaults.baseURL = 'https://api.conect360.com/';

    expect(resolveRuntimeAssetUrl('/uploads/system-branding/logo.png')).toBe(
      'https://api.conect360.com/uploads/system-branding/logo.png',
    );
    expect(resolveRuntimeAssetUrl('uploads/system-branding/logo.png')).toBe(
      'https://api.conect360.com/uploads/system-branding/logo.png',
    );
  });

  it('keeps non-upload root assets on app origin', () => {
    apiMock.defaults.baseURL = 'https://api.conect360.com/';

    expect(resolveRuntimeAssetUrl('/favicon.svg')).toBe('/favicon.svg');
  });
});
