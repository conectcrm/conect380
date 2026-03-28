import { CoreAdminLegacyRoutesMiddleware } from './core-admin-legacy-routes.middleware';

describe('CoreAdminLegacyRoutesMiddleware', () => {
  let middleware: CoreAdminLegacyRoutesMiddleware;

  beforeEach(() => {
    middleware = new CoreAdminLegacyRoutesMiddleware();
  });

  it('rewrites /admin URLs to /core-admin and keeps querystring', () => {
    const next = jest.fn();
    const req = { url: '/admin/empresas?page=2&limit=10' } as any;
    const res = { setHeader: jest.fn() } as any;

    middleware.use(req, res, next);

    expect(req.url).toBe('/core-admin/empresas?page=2&limit=10');
    expect(res.setHeader).toHaveBeenCalledWith('x-conect-legacy-route', '/admin/empresas');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rewrites /guardian URLs to /core-admin', () => {
    const next = jest.fn();
    const req = { url: '/guardian/bff/overview' } as any;
    const res = { setHeader: jest.fn() } as any;

    middleware.use(req, res, next);

    expect(req.url).toBe('/core-admin/bff/overview');
    expect(res.setHeader).toHaveBeenCalledWith('x-conect-legacy-route', '/guardian/bff/overview');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rewrites /api/admin URLs to /core-admin and keeps querystring', () => {
    const next = jest.fn();
    const req = { url: '/api/admin/bff/overview?limit=5' } as any;
    const res = { setHeader: jest.fn() } as any;

    middleware.use(req, res, next);

    expect(req.url).toBe('/core-admin/bff/overview?limit=5');
    expect(res.setHeader).toHaveBeenCalledWith('x-conect-legacy-route', '/api/admin/bff/overview');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rewrites /api/guardian URLs to /core-admin', () => {
    const next = jest.fn();
    const req = { url: '/api/guardian/empresas' } as any;
    const res = { setHeader: jest.fn() } as any;

    middleware.use(req, res, next);

    expect(req.url).toBe('/core-admin/empresas');
    expect(res.setHeader).toHaveBeenCalledWith('x-conect-legacy-route', '/api/guardian/empresas');
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('does not rewrite system-branding public/runtime endpoints', () => {
    const next = jest.fn();
    const req = { url: '/system-branding/public' } as any;
    const res = { setHeader: jest.fn() } as any;

    middleware.use(req, res, next);

    expect(req.url).toBe('/system-branding/public');
    expect(res.setHeader).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it('rewrites /admin/system-branding route to /core-admin/system-branding', () => {
    const next = jest.fn();
    const req = { url: '/admin/system-branding/public' } as any;
    const res = { setHeader: jest.fn() } as any;

    middleware.use(req, res, next);

    expect(req.url).toBe('/core-admin/system-branding/public');
    expect(res.setHeader).toHaveBeenCalledWith(
      'x-conect-legacy-route',
      '/admin/system-branding/public',
    );
    expect(next).toHaveBeenCalledTimes(1);
  });
});
