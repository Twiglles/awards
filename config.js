window.GOLOS = {
  title: 'Премия Твиглс',
  subtitle: 'Выберите лучших в каждой номинации',
  intro: 'Голосование займёт пару минут. Чтобы голос был честным, войдите через ВКонтакте или Яндекс: один аккаунт, один голос.',
  api: '',
  demo: true,
  yandexClientId: '9a4cdc984bda471d9292e49baea06533',
  vkClientId: '',
  redirectUri: location.origin + location.pathname,
  allowSkip: true,
  nominations: [
    {
      id: 'n1',
      title: 'Номинация 1',
      hint: 'Описание номинации',
      candidates: [
        { id: 'c1', name: 'Кандидат 1', text: 'Короткое описание', photo: '' },
        { id: 'c2', name: 'Кандидат 2', text: 'Короткое описание', photo: '' },
        { id: 'c3', name: 'Кандидат 3', text: 'Короткое описание', photo: '' }
      ]
    },
    {
      id: 'n2',
      title: 'Номинация 2',
      hint: 'Описание номинации',
      candidates: [
        { id: 'c1', name: 'Кандидат 1', text: 'Короткое описание', photo: '' },
        { id: 'c2', name: 'Кандидат 2', text: 'Короткое описание', photo: '' },
        { id: 'c3', name: 'Кандидат 3', text: 'Короткое описание', photo: '' }
      ]
    },
    {
      id: 'n3',
      title: 'Номинация 3',
      hint: 'Описание номинации',
      candidates: [
        { id: 'c1', name: 'Кандидат 1', text: 'Короткое описание', photo: '' },
        { id: 'c2', name: 'Кандидат 2', text: 'Короткое описание', photo: '' },
        { id: 'c3', name: 'Кандидат 3', text: 'Короткое описание', photo: '' }
      ]
    }
  ]
};
