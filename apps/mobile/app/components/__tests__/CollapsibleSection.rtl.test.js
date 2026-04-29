const React = require('react');
const { render, fireEvent } = require('@testing-library/react-native');
const { CollapsibleSection } = require('../CollapsibleSection');

describe('CollapsibleSection RTL', () => {
  test('renderiza el título correctamente', () => {
    const { getByText } = render(
      <CollapsibleSection title="Test Section">
        <div>Contenido</div>
      </CollapsibleSection>
    );
    expect(getByText('Test Section')).toBeTruthy();
  });

  test('inicialmente colapsado por defecto', () => {
    const { queryByText } = render(
      <CollapsibleSection title="Test Section">
        <div>Contenido oculto</div>
      </CollapsibleSection>
    );
    expect(queryByText('Contenido oculto')).toBeNull();
  });

  test('expandido por defecto con defaultExpanded', () => {
    const { getByText } = render(
      <CollapsibleSection defaultExpanded title="Test Section">
        <div>Contenido visible</div>
      </CollapsibleSection>
    );
    expect(getByText('Contenido visible')).toBeTruthy();
  });

  test('al hacer clic en el header expande/colapsa', () => {
    const { getByText, queryByText } = render(
      <CollapsibleSection title="Test Section">
        <div>Contenido dinámico</div>
      </CollapsibleSection>
    );
    // Inicialmente colapsado
    expect(queryByText('Contenido dinámico')).toBeNull();
    // Hacer clic en el header
    fireEvent.press(getByText('Test Section'));
    // Ahora expandido
    expect(getByText('Contenido dinámico')).toBeTruthy();
    // Hacer clic de nuevo
    fireEvent.press(getByText('Test Section'));
    // Colapsado otra vez
    expect(queryByText('Contenido dinámico')).toBeNull();
  });

  test('muestra badge cuando se proporciona', () => {
    const { getByText } = render(
      <CollapsibleSection badge="3" title="Test Section">
        <div>Contenido</div>
      </CollapsibleSection>
    );
    expect(getByText('3')).toBeTruthy();
  });

  test('actualiza badge al cambiar props', () => {
    const { getByText, rerender } = render(
      <CollapsibleSection badge="3" title="Test Section">
        <div>Contenido</div>
      </CollapsibleSection>
    );
    expect(getByText('3')).toBeTruthy();
    rerender(
      <CollapsibleSection badge="5" title="Test Section">
        <div>Contenido</div>
      </CollapsibleSection>
    );
    expect(getByText('5')).toBeTruthy();
  });

  test('muestra icono cuando se proporciona', () => {
    const { getByTestId } = render(
      <CollapsibleSection icon="account" title="Test Section">
        <div>Contenido</div>
      </CollapsibleSection>
    );
    // El icono debería estar presente (usamos testID en el componente)
  });
});
