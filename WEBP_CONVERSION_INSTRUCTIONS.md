# Инструкция по конвертации изображений в WebP

## Приоритетные изображения для конвертации

### 1. Hero Slider (3 изображения)
- `images/hero/hero-t-rex.jpg` → `images/hero/hero-t-rex.webp`
- `images/hero/hero-t-rex-2.jpg` → `images/hero/hero-t-rex-2.webp`
- `images/hero/hero-t-rex-3.jpg` → `images/hero/hero-t-rex-3.webp`

### 2. Карточки моделей (2 изображения)
- `images/cards/t-rex-flybridge-card.jpg` → `images/cards/t-rex-flybridge-card.webp`
- `images/cards/t-rex-cruiser-card.jpg` → `images/cards/t-rex-cruiser-card.webp`

### 3. Галереи Flybridge (6 изображений)
- `images/flybridge/T-Rex44Fly_FRONT_RUNNING_LUX.jpg` → `.webp`
- `images/flybridge/T-Rex44Fly_01_STERN_LUX_MARINA_16x9_4K.jpg` → `.webp`
- `images/flybridge/T-Rex44Fly_04_GOLDEN_STORM_CHARGE.jpg` → `.webp`
- `images/flybridge/T-Rex44_master-cabin_boutique-suite_03_4K.jpg` → `.webp`
- `images/flybridge/T-Rex44_lower-cabin_family-cozy_04_4K.jpg` → `.webp`
- `images/flybridge/T-Rex44_bathroom_shower-comfort_01_4K.jpg` → `.webp`

### 4. Галереи Cruiser (6 изображений)
- `images/cruiser/TRex44CR_01_Aft_Terrace_Sunset.jpg` → `.webp`
- `images/cruiser/TRex44CR_02_Marina_Lounge.jpg` → `.webp`
- `images/cruiser/T-Rex44Cruiser_cockpit_river-view_03_4K.jpg` → `.webp`
- `images/cruiser/T-Rex44Cruiser_mastercabin_evening_05_4K.jpg` → `.webp`
- `images/cruiser/T-Rex44Cruiser_bathroom_portlights_09_4K.jpg` → `.webp`
- `images/cruiser/TRex44CR_07_Stealth_Storm_Run.jpg` → `.webp`

### 5. Галерея Shipyard (6 изображений)
- `images/shipyard/T-Rex44Cruiser_salon_goldenhour_06_4K.jpg` → `.webp`
- `images/shipyard/T-Rex44_salon_helm_warm-route_07_4K.jpg` → `.webp`
- `images/shipyard/T-Rex44_lower-cabin_family-cozy_04_4K.jpg` → `.webp`
- `images/shipyard/T-Rex44_guest_bathroom_spa-details_02_4K.jpg` → `.webp`
- `images/shipyard/T-Rex44Cruiser_shower_zone_12_4K.jpg` → `.webp`
- `images/shipyard/T-Rex44Cruiser_engine-room_clean_13_4K.jpg` → `.webp`

## Способы конвертации

### Онлайн (рекомендуется для начала)
1. Перейти на [Squoosh.app](https://squoosh.app)
2. Перетащить изображение
3. Выбрать WebP в правой панели
4. Качество: 85-90%
5. Скачать и заменить в папке

### CLI (для массовой конвертации)
```bash
# Установить cwebp (Google WebP Tools)
# Windows: скачать с https://developers.google.com/speed/webp/download

# Конвертировать одно изображение
cwebp -q 85 input.jpg -o output.webp

# Массовая конвертация (PowerShell)
Get-ChildItem -Path "images\hero\*.jpg" | ForEach-Object {
    $output = $_.FullName -replace '.jpg$', '.webp'
    cwebp -q 85 $_.FullName -o $output
}
```

## После конвертации

Обновить HTML для использования `<picture>` с fallback:

```html
<!-- Пример для hero slider -->
<div class="slide slide-1" style="background-image: url('images/hero/hero-t-rex.webp'), url('images/hero/hero-t-rex.jpg');"></div>

<!-- Пример для img тегов -->
<picture>
  <source srcset="images/flybridge/T-Rex44Fly_FRONT_RUNNING_LUX.webp" type="image/webp">
  <img src="images/flybridge/T-Rex44Fly_FRONT_RUNNING_LUX.jpg" alt="..." loading="lazy">
</picture>
```

## Проверка результата
- Размер файлов должен уменьшиться на 30-50%
- Качество визуально не должно отличаться
- Браузеры автоматически выберут WebP если поддерживают, иначе JPG
