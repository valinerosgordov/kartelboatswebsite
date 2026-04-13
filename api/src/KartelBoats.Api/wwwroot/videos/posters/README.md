# Инструкция: Создание постеров для видео маршрутов

## Быстрый способ (Windows)

### 1. Сибирский исследователь (14-я секунда)

**С помощью VLC Media Player:**
1. Откройте `videos/route-siberian-explorer.mp4` в VLC
2. Нажмите Pause на 14-й секунде (00:14)
3. Нажмите `Видео` → `Сделать снимок` (или Shift+S)
4. VLC сохранит скриншот в `Изображения` или `Документы`
5. Переименуйте файл в `route-siberian-explorer-poster.jpg`
6. Переместите в `videos/posters/`

**С помощью встроенного проигрывателя Windows:**
1. Откройте `videos/route-siberian-explorer.mp4`
2. Пауза на 00:14
3. Используйте `Win + Shift + S` для Snipping Tool
4. Выделите область видео
5. Сохраните как `route-siberian-explorer-poster.jpg` в `videos/posters/`

### 2. T-Rex на Волге (1-я секунда)

Повторите те же шаги, но на 1-й секунде (00:01):
- Файл назвать: `route-trex-volga-poster.jpg`
- Сохранить в `videos/posters/`

---

## Альтернатива: FFmpeg (для идеального качества)

Если у вас установлен FFmpeg:

```powershell
# Сибирский исследователь (14-я секунда)
ffmpeg -ss 00:00:14 -i videos/route-siberian-explorer.mp4 -vframes 1 -q:v 2 videos/posters/route-siberian-explorer-poster.jpg

# T-Rex на Волге (1-я секунда)
ffmpeg -ss 00:00:01 -i videos/route-trex-volga.mp4 -vframes 1 -q:v 2 videos/posters/route-trex-volga-poster.jpg
```

---

## Требования к постерам

- **Формат:** JPG
- **Соотношение:** 16:9 (как видео)
- **Разрешение:** рекомендуется 1920x1080 или 1280x720
- **Качество:** среднее/высокое (для оптимизации загрузки)

---

## Что уже сделано в коде

✅ Видео обёрнуты в `.route-video-wrapper`
✅ Добавлен атрибут `poster=""` для каждого видео
✅ CSS для play-кнопки и duration badge
✅ Hover-эффекты для видео-карточек

После создания постеров страница автоматически покажет их вместо серого фона!
