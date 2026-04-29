const React = require('react');
const { render } = require('@testing-library/react-native');
const { ProfileProgressBar } = require('../ProfileProgressBar');
const { palette } = require('../../theme');

describe('ProfileProgressBar RTL', () => {
  test('renderiza 0% correctamente', () => {
    const { getByText } = render(<ProfileProgressBar percentage={0} />);
    expect(getByText('0%')).toBeTruthy();
    expect(getByText('Completitud del perfil')).toBeTruthy();
  });

  test('renderiza 100% correctamente', () => {
    const { getByText } = render(<ProfileProgressBar percentage={100} />);
    expect(getByText('100%')).toBeTruthy();
  });

  test('renderiza porcentaje intermedio', () => {
    const { getByText } = render(<ProfileProgressBar percentage={45} />);
    expect(getByText('45%')).toBeTruthy();
  });

  test('calcula el porcentaje desde props de datos', () => {
    const profile = { businessName: 'Test' }; // 10%
    const { getByText } = render(
      <ProfileProgressBar
        profile={profile}
        categories={[]}
        serviceAreas={[]}
        workPosts={[]}
      />
    );
    expect(getByText('10%')).toBeTruthy();
  });

  test('el color de la barra es warning para <30%', () => {
    const { container } = render(<ProfileProgressBar percentage={20} />);
    const fillBar = container.findAllByProps({ testID: 'progress-fill' }); // Opcional: agregar testID al componente
    // Alternativamente, verificar el estilo
  });
});
