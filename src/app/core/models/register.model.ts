export interface RegisterRequest {
  token: string;
  name: string;
  email: string;
  password: string;
}

export interface RegisterResponse {
  access_token: string;
  admin: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
}
