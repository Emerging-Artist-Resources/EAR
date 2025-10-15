// import { cookies } from "next/headers"
// import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
// import { Header } from "@/components/layout/header"

// async function getInitialHeaderState() {
//   try {
//     const supabase = createRouteHandlerClient({ cookies: async () => cookies() })
//     const { data } = await supabase.auth.getUser()
//     const user = data?.user
//     const initialIsAuthed = !!user
//     const initialUserName = user ? (user.user_metadata?.name ?? user.email ?? null) : null
//     const role = (user?.app_metadata?.role ?? user?.user_metadata?.role)
//     const initialUserRole = typeof role === 'string' ? role : undefined
//     return { initialIsAuthed, initialUserName, initialUserRole }
//   } catch {
//     return { initialIsAuthed: false, initialUserName: null, initialUserRole: undefined }
//   }
// }

// export default async function ServerHeader(props: { showSubmitButton?: boolean; onSubmitPerformance?: () => void }) {
//   const init = await getInitialHeaderState()
//   return (
//     <Header
//       showSubmitButton={props.showSubmitButton}
//       onSubmitPerformance={props.onSubmitPerformance}
//       initialIsAuthed={init.initialIsAuthed}
//       initialUserName={init.initialUserName}
//       initialUserRole={init.initialUserRole}
//     />
//   )
// }


