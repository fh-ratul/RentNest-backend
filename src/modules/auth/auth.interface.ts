export interface IRegisterUser {
  name: string;
  email: string;
  password: string;
  role: "TENANT" | "LANDLORD";
}

export interface ILoginUser {
  email: string;
  password: string;
}

export interface IVerifyEmail {
  email: string;
  otp: string;
}

export interface IResendOtp {
  email: string;
}

export interface IGoogleLogin {
  idToken: string;
  // Only needed on the first Google login, which signs the user up.
  role?: "TENANT" | "LANDLORD";
}
