export type PhoneCountry = {
  iso2: string;
  name: string;
  flag: string;
  dialCode: string;
  minLength: number;
  maxLength: number;
  sample: string;
};

export const PHONE_COUNTRIES: PhoneCountry[] = [
  {
    iso2: 'BR',
    name: 'Brasil',
    flag: '',
    dialCode: '55',
    minLength: 10,
    maxLength: 11,
    sample: '11999998888',
  },
  {
    iso2: 'US',
    name: 'Estados Unidos',
    flag: '',
    dialCode: '1',
    minLength: 10,
    maxLength: 10,
    sample: '2015550123',
  },
  {
    iso2: 'CA',
    name: 'Canada',
    flag: '',
    dialCode: '1',
    minLength: 10,
    maxLength: 10,
    sample: '4165550123',
  },
  {
    iso2: 'MX',
    name: 'Mexico',
    flag: '',
    dialCode: '52',
    minLength: 10,
    maxLength: 10,
    sample: '5512345678',
  },
  {
    iso2: 'AR',
    name: 'Argentina',
    flag: '',
    dialCode: '54',
    minLength: 10,
    maxLength: 10,
    sample: '1123456789',
  },
  {
    iso2: 'CL',
    name: 'Chile',
    flag: '',
    dialCode: '56',
    minLength: 9,
    maxLength: 9,
    sample: '912345678',
  },
  {
    iso2: 'CO',
    name: 'Colombia',
    flag: '',
    dialCode: '57',
    minLength: 10,
    maxLength: 10,
    sample: '3001234567',
  },
  {
    iso2: 'PE',
    name: 'Peru',
    flag: '',
    dialCode: '51',
    minLength: 9,
    maxLength: 9,
    sample: '912345678',
  },
  {
    iso2: 'PT',
    name: 'Portugal',
    flag: '',
    dialCode: '351',
    minLength: 9,
    maxLength: 9,
    sample: '912345678',
  },
  {
    iso2: 'ES',
    name: 'Espanha',
    flag: '',
    dialCode: '34',
    minLength: 9,
    maxLength: 9,
    sample: '612345678',
  },
  {
    iso2: 'FR',
    name: 'Franca',
    flag: '',
    dialCode: '33',
    minLength: 9,
    maxLength: 9,
    sample: '612345678',
  },
  {
    iso2: 'DE',
    name: 'Alemanha',
    flag: '',
    dialCode: '49',
    minLength: 10,
    maxLength: 11,
    sample: '15123456789',
  },
  {
    iso2: 'IT',
    name: 'Italia',
    flag: '',
    dialCode: '39',
    minLength: 9,
    maxLength: 10,
    sample: '3123456789',
  },
  {
    iso2: 'GB',
    name: 'Reino Unido',
    flag: '',
    dialCode: '44',
    minLength: 10,
    maxLength: 10,
    sample: '7400123456',
  },
  {
    iso2: 'AU',
    name: 'Australia',
    flag: '',
    dialCode: '61',
    minLength: 9,
    maxLength: 9,
    sample: '412345678',
  },
  {
    iso2: 'JP',
    name: 'Japao',
    flag: '',
    dialCode: '81',
    minLength: 10,
    maxLength: 10,
    sample: '9012345678',
  },
];

export const DEFAULT_PHONE_COUNTRY_ISO = 'BR';

export const sanitizePhoneDigits = (value: string): string => value.replace(/\D/g, '');

export const getPhoneCountryByIso = (iso2?: string): PhoneCountry =>
  PHONE_COUNTRIES.find((country) => country.iso2 === iso2) ??
  PHONE_COUNTRIES.find((country) => country.iso2 === DEFAULT_PHONE_COUNTRY_ISO) ??
  PHONE_COUNTRIES[0];

export const toE164 = (country: PhoneCountry, nationalNumber: string): string => {
  const cleanDigits = sanitizePhoneDigits(nationalNumber).replace(/^0+/, '');
  if (!cleanDigits) {
    return '';
  }

  return `+${country.dialCode}${cleanDigits}`;
};

export const parsePhoneValue = (
  value?: string,
): { country: PhoneCountry; nationalNumber: string } => {
  const baseCountry = getPhoneCountryByIso(DEFAULT_PHONE_COUNTRY_ISO);
  if (!value || value.trim() === '') {
    return { country: baseCountry, nationalNumber: '' };
  }

  const raw = value.trim();
  const digits = sanitizePhoneDigits(raw);
  if (!digits) {
    return { country: baseCountry, nationalNumber: '' };
  }

  // Compatibility for legacy values without +country.
  if (!raw.startsWith('+') && digits.length <= 11) {
    return { country: baseCountry, nationalNumber: digits };
  }

  const sortedCountries = [...PHONE_COUNTRIES].sort(
    (left, right) => right.dialCode.length - left.dialCode.length,
  );
  const matchedCountry = sortedCountries.find((country) => digits.startsWith(country.dialCode));

  if (!matchedCountry) {
    return { country: baseCountry, nationalNumber: digits };
  }

  return {
    country: matchedCountry,
    nationalNumber: digits.slice(matchedCountry.dialCode.length),
  };
};

export const isValidE164Phone = (value: string): boolean => {
  if (!/^\+\d{8,15}$/.test(value)) {
    return false;
  }

  const digits = sanitizePhoneDigits(value);
  const sortedCountries = [...PHONE_COUNTRIES].sort(
    (left, right) => right.dialCode.length - left.dialCode.length,
  );
  const matchedCountry = sortedCountries.find((country) => digits.startsWith(country.dialCode));

  if (!matchedCountry) {
    return digits.length >= 8 && digits.length <= 15;
  }

  const nationalNumberLength = digits.slice(matchedCountry.dialCode.length).length;
  return (
    nationalNumberLength >= matchedCountry.minLength &&
    nationalNumberLength <= matchedCountry.maxLength
  );
};
