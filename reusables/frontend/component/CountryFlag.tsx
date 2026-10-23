// Shared flag icon for country codes - sprite from the `flag-icons` package (imported globally).
export default function CountryFlag({ code }: { code: string }) {
  return <span className={`fi fi-${code.toLowerCase()} rounded-sm shrink-0`} />
}
