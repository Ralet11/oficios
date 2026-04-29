const { getProfileCompletion } = require('../ProfileProgressBar');

describe('getProfileCompletion', () => {
  test('perfil vacío devuelve 0%', () => {
    const result = getProfileCompletion({}, [], [], []);
    expect(result).toBe(0);
  });

  test('perfil con todos los campos completos devuelve 100%', () => {
    const profile = {
      businessName: 'Gasfitería Juan',
      headline: 'Especialista en reparaciones de gas',
      bio: 'Llevo más de 10 años trabajando en reparaciones de gas y plomería residencial. Atiendo emergencias las 24 horas.',
      yearsExperience: 10,
      avatarUrl: 'https://example.com/avatar.jpg',
      coverUrl: 'https://example.com/cover.jpg',
      photoUrls: ['https://example.com/photo1.jpg', 'https://example.com/photo2.jpg'],
    };
    const categories = [1, 2];
    const serviceAreas = [{ city: 'Buenos Aires', province: 'Buenos Aires', radiusKm: 10 }];
    const workPosts = [
      { title: 'Reparación de caldera', body: 'Cambio de válvula de gas en departamento.' },
    ];

    const result = getProfileCompletion(profile, categories, serviceAreas, workPosts);
    expect(result).toBe(100);
  });

  test('solo businessName agrega 10%', () => {
    const profile = { businessName: 'Test' };
    const result = getProfileCompletion(profile, [], [], []);
    expect(result).toBe(10);
  });

  test('solo headline agrega 10%', () => {
    const profile = { headline: 'Test' };
    const result = getProfileCompletion(profile, [], [], []);
    expect(result).toBe(10);
  });

  test('bio con 50+ caracteres agrega 15%', () => {
    const profile = { bio: 'a'.repeat(50) };
    const result = getProfileCompletion(profile, [], [], []);
    expect(result).toBe(15);
  });

  test('bio con menos de 50 caracteres no agrega 15%', () => {
    const profile = { bio: 'a'.repeat(49) };
    const result = getProfileCompletion(profile, [], [], []);
    expect(result).toBe(0);
  });

  test('yearsExperience >0 agrega 5%', () => {
    const profile = { yearsExperience: 1 };
    const result = getProfileCompletion(profile, [], [], []);
    expect(result).toBe(5);
  });

  test('yearsExperience 0 no agrega 5%', () => {
    const profile = { yearsExperience: 0 };
    const result = getProfileCompletion(profile, [], [], []);
    expect(result).toBe(0);
  });

  test('avatarUrl agrega 10%', () => {
    const profile = { avatarUrl: 'https://example.com' };
    const result = getProfileCompletion(profile, [], [], []);
    expect(result).toBe(10);
  });

  test('coverUrl agrega 5%', () => {
    const profile = { coverUrl: 'https://example.com' };
    const result = getProfileCompletion(profile, [], [], []);
    expect(result).toBe(5);
  });

  test('al menos 1 photoUrl agrega 10%', () => {
    const profile = { photoUrls: ['https://example.com'] };
    const result = getProfileCompletion(profile, [], [], []);
    expect(result).toBe(10);
  });

  test('al menos 1 categoría agrega 10%', () => {
    const result = getProfileCompletion({}, [1], [], []);
    expect(result).toBe(10);
  });

  test('al menos 1 zona de servicio válida agrega 10%', () => {
    const serviceAreas = [{ city: 'BA', province: 'BA' }];
    const result = getProfileCompletion({}, [], serviceAreas, []);
    expect(result).toBe(10);
  });

  test('zona de servicio sin city no agrega 10%', () => {
    const serviceAreas = [{ city: '', province: 'BA' }];
    const result = getProfileCompletion({}, [], serviceAreas, []);
    expect(result).toBe(0);
  });

  test('al menos 1 workPost válido agrega 15%', () => {
    const workPosts = [{ title: 'Test', body: 'Test body' }];
    const result = getProfileCompletion({}, [], [], workPosts);
    expect(result).toBe(15);
  });

  test('workPost sin title no agrega 15%', () => {
    const workPosts = [{ title: '', body: 'Test body' }];
    const result = getProfileCompletion({}, [], [], workPosts);
    expect(result).toBe(0);
  });

  test('el total no supera 100%', () => {
    // Todos los campos duplicados no deberían pasar 100
    const profile = {
      businessName: 'Test',
      headline: 'Test',
      bio: 'a'.repeat(100),
      yearsExperience: 5,
      avatarUrl: 'https://example.com',
      coverUrl: 'https://example.com',
      photoUrls: ['https://example.com'],
    };
    const categories = [1, 2, 3];
    const serviceAreas = [
      { city: 'BA', province: 'BA' },
      { city: 'Córdoba', province: 'Córdoba' },
    ];
    const workPosts = [
      { title: 'Test1', body: 'Body1' },
      { title: 'Test2', body: 'Body2' },
    ];
    const result = getProfileCompletion(profile, categories, serviceAreas, workPosts);
    expect(result).toBeLessThanOrEqual(100);
  });
});
