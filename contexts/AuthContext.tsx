import { createContext, ReactNode, useEffect, useState } from "react";
import Router from 'next/router'
import { setCookie, parseCookies, destroyCookie } from 'nookies'
import { api } from "../services/apiClient";

type User={
  email: string;
  permissions: string[]
  roles: string;
}

type SignInCredentials = {
  email: string;
  password: string;
}

type AuthContextData = {
  signIn(credentials: SignInCredentials): Promise<void>;
  isAuthenticated: boolean;
  user: User
}
type AuthProviderProps = {
  children: ReactNode //pode receber qualquer coisa dentro dele (componentes, textos, ...)
}

export const AuthContext = createContext({} as AuthContextData);

export function signOut(){
  destroyCookie(undefined, 'nextauth.token')
  destroyCookie(undefined, 'nextauth.refreshToken')

  Router.push('/')
}

export function AuthProvider({children}:AuthProviderProps){
  const [user, setUser] = useState<User>()
const isAuthenticated = !!user;

useEffect(() => { //use effect sempre roda pelo lado do browser, nunca pelo lado do servidor
const {'nextauth.token': token} = parseCookies()

if(token){
api.get('/me').then(response => {
  const {email, permissions, roles} = response.data

  setUser({email, permissions, roles})
}).catch( () => {
  signOut()
})
}
},[])

async function signIn({email, password} : SignInCredentials){
  try{

    const response = await api.post('sessions', {email, password})
    const { token, refreshToken, permissions, roles} = response.data;

    setCookie(undefined, 'nextauth.token', token,{
      maxAge: 60 * 60 * 24 * 30, // quanto tempo ficarão salvas as informações no cookie
      path: '/' //quais rotas da aplicação terão acesso aos cookies (ao colocar a barra quer dizer que todas as rotas terão acesso)
    })
    setCookie(undefined, 'nextauth.refreshToken', refreshToken,{
      maxAge: 60 * 60 * 24 * 30, // quanto tempo ficarão salvas as informações no cookie
      path: '/' //quais rotas da aplicação terão acesso aos cookies (ao colocar a barra quer dizer que todas as rotas terão acesso)
    })
    //primeiro parametro será sempre undefined se estiver sendo executado pelo lado do browser
    //segundo é o nome do cookie
    //terceiro é o valor do token
    //quarto são configurações adicionais
    setUser({
      email,
      permissions,
      roles,
    })

    api.defaults.headers['Authorization'] = `Bearer ${token}`;
    Router.push('/dashboard')
  }
  catch(err){
    console.log(err)
  }
}

  return(
    <AuthContext.Provider value={{signIn, isAuthenticated, user}}>
      {children}
    </AuthContext.Provider>
  )
}