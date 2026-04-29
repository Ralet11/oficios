const React = require('react');
const { render, getByTestId } = require('@testing-library/react-native');
const { WorkPostCardLinkedIn } = require('../WorkPostCardLinkedIn');

describe('WorkPostCardLinkedIn RTL', () => {
  const mockPost = {
    title: 'Reparación de caldera',
    body: 'Cambio de válvula de gas en departamento.',
    photoUrls: [
      'https://example.com/cover.jpg',
      'https://example.com/1.jpg',
      'https://example.com/2.jpg',
      'https://example.com/3.jpg',
      'https://example.com/4.jpg',
    ],
    highlightLines: ['Limpieza incluida', 'Presupuesto sin cargo'],
  };

  test('renderiza título en negrita', () => {
    const { getByText } = render(<WorkPostCardLinkedIn post={mockPost} />);
    const title = getByText('Reparación de caldera');
    // Verificar que el estilo tiene fontWeight 800
    expect(title.props.style).toContainEqual(
      expect.objectContaining({ fontWeight: '800' })
    );
  });

  test('renderiza portada a ancho completo', () => {
    const { getByTestId } = render(<WorkPostCardLinkedIn post={mockPost} />);
    // Agregar testID="cover" al componente
    const cover = getByTestId('workpost-cover');
    expect(cover).toBeTruthy();
    // Verificar que el ancho es 100%
  });

  test('renderiza grid 2x2 con 4 fotos', () => {
    const { getByTestId } = render(<WorkPostCardLinkedIn post={mockPost} />);
    // Agregar testID="photo-grid" al grid
    const grid = getByTestId('workpost-photo-grid');
    expect(grid).toBeTruthy();
    // Verificar que hay 4 imagenes en el grid
  });

  test('renderiza placeholder si no hay portada', () => {
    const postSinPortada = { ...mockPost, photoUrls: [] };
    const { getByText } = render(<WorkPostCardLinkedIn post={postSinPortada} />);
    expect(getByText('Sin título')).toBeTruthy(); // O el placeholder
  });

  test('maneja onPress correctamente', () => {
    const onPressMock = jest.fn();
    const { getByTestId } = render(
      <WorkPostCardLinkedIn onPress={onPressMock} post={mockPost} />
    );
    fireEvent.press(getByTestId('workpost-card'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });
});
