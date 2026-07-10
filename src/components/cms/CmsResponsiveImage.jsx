export function getCmsAltText(source, fallback = 'Contenido de La Despensa Rayana') {
  return source?.altText || source?.title || fallback;
}

export function CmsResponsiveImage({ source, fallbackAlt, className = '' }) {
  if (!source?.imageUrl && !source?.mobileImageUrl) return null;
  const desktopImage = source.imageUrl || source.mobileImageUrl;
  const mobileImage = source.mobileImageUrl || desktopImage;

  return (
    <picture>
      {mobileImage && <source media="(max-width: 720px)" srcSet={mobileImage} />}
      <img className={className} src={desktopImage} alt={getCmsAltText(source, fallbackAlt)} />
    </picture>
  );
}
