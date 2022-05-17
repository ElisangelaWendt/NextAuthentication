//conexão com backend

import axios, { AxiosError } from 'axios';
import { parseCookies, setCookie } from 'nookies'
import { signOut } from '../contexts/AuthContext';
import { AuthTokenError } from '../errors/AuthTokenError';

let isRefreshing = false;
let failedRequestQueue = []

export function setupAPIClient(ctx = undefined){
let cookies = parseCookies(ctx)
  
interface AxiosErrorResponse {
  code?: string;
}

//executa somente uma vez
const api = axios.create({
  baseURL: 'http://localhost:3333',
  headers:{
    Authorization: `Bearer ${cookies['nextauth.token']}`
  }
})

//parte para que o usuário seja deslogado e os cookies excluidos
//pode ser executado várias vezes enquanto o usuário está logado
api.interceptors.response.use(response => {
  return response
}, (error: AxiosError<AxiosErrorResponse>) =>{
 if(error.response.status === 401){
   if(error.response.data?.code === 'token.expired'){
     //renovar os cookies
      cookies = parseCookies(ctx)

      const { 'nextauth.refreshToken': refreshToken} = cookies;
      const originalConfig = error.config

      //vai renovar o token somente uma vez, independente de quantas requisições estão sendo feitas
      if(!isRefreshing){
        isRefreshing = true;

        api.post('/refresh', {
          refreshToken,
        }).then(response => {
          const {token} = response.data
  
          setCookie(ctx, 'nextauth.token', token,{
            maxAge: 60 * 60 * 24 * 30, // quanto tempo ficarão salvas as informações no cookie
            path: '/' //quais rotas da aplicação terão acesso aos cookies (ao colocar a barra quer dizer que todas as rotas terão acesso)
          })
          setCookie(ctx, 'nextauth.refreshToken', response.data.refreshToken,{
            maxAge: 60 * 60 * 24 * 30, // quanto tempo ficarão salvas as informações no cookie
            path: '/' //quais rotas da aplicação terão acesso aos cookies (ao colocar a barra quer dizer que todas as rotas terão acesso)
          })
  
          api.defaults.headers['Authorization'] = `Bearer ${token}`;

          failedRequestQueue.forEach(request => request.onSuccess(token))
          failedRequestQueue = []
        }).catch(err => {
          failedRequestQueue.forEach(request => request.onFailure(err))
          failedRequestQueue = [];

          if(process.browser){//verificar se o processo está rodando no browser e não no server
            signOut()
          }
        }).finally(() => {
          isRefreshing = false
        })
      }

      return new Promise((resolve, reject) => {
        failedRequestQueue.push({
          onSuccess: (token: string) => {
            originalConfig.headers['Authorization'] = `Bearer ${token}`

            //resolve é usado para que o axios aguarda até que a requisição seja feita
            //não aceita o await
            resolve(api(originalConfig))
          },
          onFailure: (err: AxiosError) => {
            reject(err)
          }
        })
      })
   }else{
    //deslogar usuário
    if(process.browser){
      signOut()
    }else{
      return Promise.reject(new AuthTokenError())
    }
   }
 }

 return Promise.reject(error) // serve para deixar os erros acontecendo até que se resolvam
})
//intercepta uma resposta vinda do backend
//primeiro parametro serve para informar o que fazer se a resposta der sucesso
//segundo parametro serve para dizer o que fazer caso a resposta dê erro

return api
}