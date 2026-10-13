import useAuth from './useAuth';
import { PATHS } from '../routes/paths';

export default function useLandingDestinations() {
  const { sessions } = useAuth();
  const userAuthenticated = Boolean(sessions.user?.isAuthenticated);
  const expertAuthenticated = Boolean(sessions.expert?.isAuthenticated);

  return {
    startCasePath: userAuthenticated ? PATHS.USER_CASE_NEW : PATHS.REGISTER,
    browseExpertsPath: userAuthenticated ? PATHS.USER_CASES : PATHS.REGISTER,
    expertPath: expertAuthenticated ? PATHS.EXPERT_DASHBOARD : PATHS.EXPERT_REGISTER,
  };
}
