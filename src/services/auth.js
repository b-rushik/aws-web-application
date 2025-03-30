import { Auth } from 'aws-amplify';

export const login = async (email, password) => {
  try {
    const user = await Auth.signIn(email, password);
    return { success: true, user };
  } catch (error) {
    return { success: false, error };
  }
};

export const logout = async () => {
  try {
    await Auth.signOut();
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

export const register = async (email, password, attributes) => {
  try {
    const { user } = await Auth.signUp({
      username: email,
      password,
      attributes,
    });
    return { success: true, user };
  } catch (error) {
    return { success: false, error };
  }
};

export const verifyUser = async (email, code) => {
  try {
    await Auth.confirmSignUp(email, code);
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};