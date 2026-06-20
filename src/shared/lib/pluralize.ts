const pluralRules = new Intl.PluralRules("ru-RU");

/**
 * Возвращает функцию выбора формы множественного числа слова.
 *
 * @example
 * let pluralizeFiles = pluralize('файл', 'файла', 'файлов');
 * console.log(`Выбрано 23 ${pluralizeFiles(23)}`) // → Выбрано 23 файла
 */
export function pluralize(
  one: string,
  few: string,
  many: string = few,
): (n: number) => string {
  return (n) => {
    const rule = pluralRules.select(n);

    switch (rule) {
      case "one":
        return one;
      case "few":
        return few;
      default:
        return many;
    }
  };
}
