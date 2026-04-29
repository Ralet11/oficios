const React = require('react');
const { render } = require('@testing-library/react-native');
const { RootNavigator } = require('../RootNavigator');
const { APP_MODES } = require('../../services/sessionMode');

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

const { useAuth } = require('../../contexts/AuthContext');

describe('RootNavigator Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('cliente en modo cliente ve tabs de cliente', () => {
    useAuth.mockReturnValue({
      activeMode: APP_MODES.CUSTOMER,
      booting: false,
      professionalProfile: null,
      signedIn: true,
      user: { roles: ['CUSTOMER'] },
    });

    const { getByText, queryByText } = render(<RootNavigator />);

    expect(getByText('Inicio')).toBeTruthy();
    expect(getByText('Mis problemas')).toBeTruthy();
    expect(getByText('Cuenta')).toBeTruthy();
    expect(queryByText('Mi Hub')).toBeNull();
    expect(queryByText('Oportunidades')).toBeNull();
  });

  test('profesional en modo cliente sigue viendo solo tabs de cliente', () => {
    useAuth.mockReturnValue({
      activeMode: APP_MODES.CUSTOMER,
      booting: false,
      professionalProfile: { status: 'APPROVED' },
      signedIn: true,
      user: { roles: ['CUSTOMER', 'PROFESSIONAL'] },
    });

    const { getByText, queryByText } = render(<RootNavigator />);

    expect(getByText('Inicio')).toBeTruthy();
    expect(getByText('Mis problemas')).toBeTruthy();
    expect(getByText('Cuenta')).toBeTruthy();
    expect(queryByText('Mi Hub')).toBeNull();
    expect(queryByText('Oportunidades')).toBeNull();
  });

  test('profesional aprobado en modo profesional ve tabs pro', () => {
    useAuth.mockReturnValue({
      activeMode: APP_MODES.PROFESSIONAL,
      booting: false,
      professionalProfile: { status: 'APPROVED' },
      signedIn: true,
      user: { roles: ['CUSTOMER', 'PROFESSIONAL'] },
    });

    const { getByText, queryByText } = render(<RootNavigator />);

    expect(getByText('Conversaciones')).toBeTruthy();
    expect(getByText('Oportunidades')).toBeTruthy();
    expect(getByText('Mi Hub')).toBeTruthy();
    expect(getByText('Cuenta')).toBeTruthy();
    expect(queryByText('Inicio')).toBeNull();
  });

  test('profesional no aprobado en modo profesional ve shell reducida', () => {
    useAuth.mockReturnValue({
      activeMode: APP_MODES.PROFESSIONAL,
      booting: false,
      professionalProfile: { status: 'PENDING_APPROVAL' },
      signedIn: true,
      user: { roles: ['CUSTOMER', 'PROFESSIONAL'] },
    });

    const { getByText, queryByText } = render(<RootNavigator />);

    expect(getByText('Mi Hub')).toBeTruthy();
    expect(getByText('Cuenta')).toBeTruthy();
    expect(queryByText('Conversaciones')).toBeNull();
    expect(queryByText('Oportunidades')).toBeNull();
  });

  test('admin en modo cliente sigue viendo acceso admin', () => {
    useAuth.mockReturnValue({
      activeMode: APP_MODES.CUSTOMER,
      booting: false,
      professionalProfile: null,
      signedIn: true,
      user: { roles: ['CUSTOMER', 'ADMIN'] },
    });

    const { getByText } = render(<RootNavigator />);

    expect(getByText('Admin')).toBeTruthy();
  });

  test('no renderiza tabs si no esta autenticado', () => {
    useAuth.mockReturnValue({
      activeMode: APP_MODES.CUSTOMER,
      booting: false,
      signedIn: false,
      user: null,
    });

    const { queryByText } = render(<RootNavigator />);

    expect(queryByText('Inicio')).toBeNull();
  });
});
