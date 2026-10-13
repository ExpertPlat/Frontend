import useAdminAuthorization from './useAdminAuthorization';

/** Renders its children only when the signed-in admin holds the permission(s). */
export default function Can({ permission, anyOf, allOf, fallback = null, children }) {
  const { can, canAny, canAll, session } = useAdminAuthorization();
  if (session?.isLoading) return null;
  let allowed = true;
  if (permission) allowed = can(permission);
  else if (Array.isArray(anyOf)) allowed = canAny(anyOf);
  else if (Array.isArray(allOf)) allowed = canAll(allOf);
  return allowed ? children : fallback;
}
