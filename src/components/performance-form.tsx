// "use client"

// import { useState } from "react"
// import { useForm } from "react-hook-form"
// import { zodResolver } from "@hookform/resolvers/zod"
// import { performanceSchema, type PerformanceFormData } from "@/lib/validations"
// import { useSession } from "next-auth/react"
// import { useRouter } from "next/navigation"

// export default function PerformanceForm() {
//   const [isSubmitting, setIsSubmitting] = useState(false)
//   const [submitMessage, setSubmitMessage] = useState("")
//   const { data: session } = useSession()
//   const router = useRouter()

//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//     reset,
//   } = useForm<PerformanceFormData>({
//     resolver: zodResolver(performanceSchema),
//   })

//   const onSubmit = async (data: PerformanceFormData) => {
//     if (!session?.user?.id) {
//       setSubmitMessage("You must be logged in to submit a performance")
//       return
//     }

//     setIsSubmitting(true)
//     setSubmitMessage("")

//     try {
//       const response = await fetch("/api/performances", {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({
//           ...data,
//           userId: session.user.id,
//         }),
//       })

//       if (response.ok) {
//         setSubmitMessage("Performance submitted successfully! It will be reviewed by an admin.")
//         reset()
//       } else {
//         const errorData = await response.json()
//         setSubmitMessage(errorData.error || "Failed to submit performance")
//       }
//     } catch (error) {
//       setSubmitMessage("An error occurred while submitting the performance")
//     } finally {
//       setIsSubmitting(false)
//     }
//   }

//   if (!session) {
//     return (
//       <div className="text-center py-8">
//         <p className="text-gray-600">Please sign in to submit a performance.</p>
//         <button
//           onClick={() => router.push("/auth/signin")}
//           className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700"
//         >
//           Sign In
//         </button>
//       </div>
//     )
//   }

//   return (
//     <div className="max-w-2xl mx-auto p-6">
//       <h1 className="text-3xl font-bold text-gray-900 mb-8">Submit Performance</h1>
      
//       <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
//         <div>
//           <label htmlFor="title" className="block text-sm font-medium text-gray-700">
//             Performance Title *
//           </label>
//           <input
//             {...register("title")}
//             type="text"
//             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//             placeholder="Enter performance title"
//           />
//           {errors.title && (
//             <p className="mt-1 text-sm text-red-600">{errors.title.message}</p>
//           )}
//         </div>

//         <div>
//           <label htmlFor="description" className="block text-sm font-medium text-gray-700">
//             Description
//           </label>
//           <textarea
//             {...register("description")}
//             rows={4}
//             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//             placeholder="Describe your performance"
//           />
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div>
//             <label htmlFor="date" className="block text-sm font-medium text-gray-700">
//               Performance Date *
//             </label>
//             <input
//               {...register("date")}
//               type="date"
//               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//             />
//             {errors.date && (
//               <p className="mt-1 text-sm text-red-600">{errors.date.message}</p>
//             )}
//           </div>

//           <div>
//             <label htmlFor="time" className="block text-sm font-medium text-gray-700">
//               Performance Time
//             </label>
//             <input
//               {...register("time")}
//               type="time"
//               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//             />
//           </div>
//         </div>

//         <div>
//           <label htmlFor="location" className="block text-sm font-medium text-gray-700">
//             Location
//           </label>
//           <input
//             {...register("location")}
//             type="text"
//             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//             placeholder="Where will the performance take place?"
//           />
//         </div>

//         <div>
//           <label htmlFor="performer" className="block text-sm font-medium text-gray-700">
//             Performer Name *
//           </label>
//           <input
//             {...register("performer")}
//             type="text"
//             className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//             placeholder="Enter performer name"
//           />
//           {errors.performer && (
//             <p className="mt-1 text-sm text-red-600">{errors.performer.message}</p>
//           )}
//         </div>

//         <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
//           <div>
//             <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700">
//               Contact Email
//             </label>
//             <input
//               {...register("contactEmail")}
//               type="email"
//               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//               placeholder="contact@example.com"
//             />
//             {errors.contactEmail && (
//               <p className="mt-1 text-sm text-red-600">{errors.contactEmail.message}</p>
//             )}
//           </div>

//           <div>
//             <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700">
//               Contact Phone
//             </label>
//             <input
//               {...register("contactPhone")}
//               type="tel"
//               className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
//               placeholder="(555) 123-4567"
//             />
//           </div>
//         </div>

//         {submitMessage && (
//           <div className={`p-4 rounded-md ${
//             submitMessage.includes("successfully") 
//               ? "bg-green-50 text-green-800" 
//               : "bg-red-50 text-red-800"
//           }`}>
//             {submitMessage}
//           </div>
//         )}

//         <div className="flex justify-end space-x-4">
//           <button
//             type="button"
//             onClick={() => reset()}
//             className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
//           >
//             Reset
//           </button>
//           <button
//             type="submit"
//             disabled={isSubmitting}
//             className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
//           >
//             {isSubmitting ? "Submitting..." : "Submit Performance"}
//           </button>
//         </div>
//       </form>
//     </div>
//   )
// }
