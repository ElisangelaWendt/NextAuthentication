type User={
  permissions: string[]
  roles: string[]
}

type ValidateUserPermissionsParams = {
  user: User;
  permissions?: string[];
  roles?: string[]
}

export function validateUsersPermissions({user, permissions, roles}: ValidateUserPermissionsParams){

  if(permissions?.length > 0){
    //every somente retorna true se todas as condições dele forem satisfeitas
    const hasAllPermissions = permissions.every(permission => {
      return user.permissions.includes(permission)
    })
  
    if(!hasAllPermissions){
      return false
    }
  }
  
  if(roles?.length > 0){
    //some verifica se o usuário tem pelo menos uma das roles
    const hasAllRoles = roles.some(role => {
      return user.roles.includes(role)
    })
  
    if(!hasAllRoles){
      return false
    }
  }
  return true;
  
}