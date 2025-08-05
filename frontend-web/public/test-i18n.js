console.log('🧪 Testando sistema de idiomas...');

// Testar se o sistema i18next está funcionando
if (typeof window !== 'undefined' && window.localStorage) {
  console.log('📱 LocalStorage disponível');

  // Verificar idioma salvo
  const savedLang = localStorage.getItem('preferred-language');
  console.log('💾 Idioma salvo no localStorage:', savedLang);

  // Verificar i18next
  if (window.i18next) {
    console.log('🌐 i18next disponível');
    console.log('🗣️ Idioma atual do i18next:', window.i18next.language);
    console.log('🔧 Recursos carregados:', Object.keys(window.i18next.services.resourceStore.data));

    // Testar função t
    try {
      const settingsText = window.i18next.t('navigation.settings');
      console.log('🔤 Teste navigation.settings:', settingsText);

      const preferencesText = window.i18next.t('common.preferences');
      console.log('🔤 Teste common.preferences:', preferencesText);

      const dashboardText = window.i18next.t('navigation.dashboard');
      console.log('🔤 Teste navigation.dashboard:', dashboardText);
    } catch (error) {
      console.error('❌ Erro ao testar função t:', error);
    }
  } else {
    console.log('❌ i18next não encontrado no window');
  }
} else {
  console.log('❌ LocalStorage não disponível');
}

// Verificar se os componentes React conseguem acessar as traduções
if (typeof document !== 'undefined') {
  setTimeout(() => {
    const menuItems = document.querySelectorAll('[class*="menu"]');
    console.log('🎯 Itens de menu encontrados:', menuItems.length);

    menuItems.forEach((item, index) => {
      console.log(`📝 Menu ${index}:`, item.textContent);
    });
  }, 2000);
}
