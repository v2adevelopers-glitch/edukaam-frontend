export interface ProviderProfile {
  id: number;
  user_id: number;
  provider_code: string;
  institution_name: string;
  institution_type_id: number | null;
  institution_type_name?: string;
  contact_person: string;
  designation: string;
  mobile: string;
  email: string;
  established_year: number | null;
  website: string;
  about: string;
  address: string;
  state_id: number | null;
  state_name?: string;
  city_id: number | null;
  city_name?: string;
  pincode: string;
  updated_at: string;
}

export interface ProviderProfilePayload {
  institution_name: string;
  institution_type_id: number | null;
  contact_person: string;
  designation: string;
  mobile: string;
  established_year: number | null;
  website: string;
  about: string;
  address: string;
  state_id: number | null;
  city_id: number | null;
  pincode: string;
}

export interface ProviderProfileDetailResponse {
  success: boolean;
  statusCode: number;
  message: string;
  resData: { data: ProviderProfile } | ProviderProfile;
}

export interface ProviderProfileMutationResponse {
  success: boolean;
  statusCode: number;
  message: string;
  resData: { data: ProviderProfile } | null;
}
