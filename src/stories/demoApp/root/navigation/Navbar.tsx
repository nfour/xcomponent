import { X } from '@/X';
import { Col, Row } from '@/__common/Grid';

export const Navbar = X(() => {
  const { router, authApi } = X.useRootState();

  return (
    <Col>
      <Row
        css={{
          padding: '1rem 0.5rem',
          marginBottom: '1rem',
          fontFamily: 'monospace',
          border: '1px solid #ccc',
        }}
      >
        {router.route?.toUri()}
      </Row>
      <Row
        css={{
          flexGrow: 0,
          gap: '1rem',
        }}
      >
        <Row css={{ flexGrow: 0 }}>Demo App</Row>
        <Row
          css={{
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <Row
            css={{
              gap: '0.5rem',
            }}
          >
            {[router.routes.home, router.routes.app].map((route) => (
              <button
                onClick={(e) => {
                  e.preventDefault();

                  router.routes[route.key].push({});
                }}
                css={{
                  // is active?
                  ...(router.route?.key === route.key
                    ? { fontWeight: 'bold', boxShadow: '0 1px  6px #0006' }
                    : {}),
                }}
              >
                {route.key}
              </button>
            ))}
          </Row>
          <Row>
            <Col>
              {(() => {
                if (authApi.isLoggedIn)
                  return (
                    <Row>
                      <button
                        onClick={(e) => {
                          router.routes.appProfile.push({
                            pathname: {
                              username: authApi.login.value?.username,
                            },
                          });
                        }}
                      >
                        Profile
                      </button>
                      <button
                        onClick={(e) => {
                          router.routes.appLogout.push();
                        }}
                      >
                        Logout
                      </button>
                    </Row>
                  );

                return (
                  <Row>
                    <button
                      onClick={(e) => {
                        router.routes.appLogin.push();
                      }}
                    >
                      Login
                    </button>
                  </Row>
                );
              })()}
            </Col>
          </Row>
        </Row>
      </Row>
    </Col>
  );
});
