// API endpoints simulados para autenticación
export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  
  // Simulación de usuarios
  const users = [
    {
      id: 1,
      name: 'Juan Pérez',
      email: 'socio@demo.com',
      password: '123456',
      type: 'socio',
      phone: '+1 234 567 8900',
      address: 'Calle 123, Ciudad'
    },
    {
      id: 2,
      name: 'María Admin',
      email: 'admin@demo.com',
      password: '123456',
      type: 'admin',
      phone: '+1 234 567 8901',
      address: 'Oficina Principal'
    }
  ]
  
  const { email, password } = body
  
  const user = users.find(u => u.email === email && u.password === password)
  
  if (!user) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Credenciales incorrectas'
    })
  }
  
  // Remover password del objeto de respuesta
  const { password: _, ...userWithoutPassword } = user
  
  return {
    success: true,
    user: userWithoutPassword,
    message: 'Login exitoso'
  }
})
