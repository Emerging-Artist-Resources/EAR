// /**
//  * @jest-environment jsdom
//  */
// import React from 'react'
// import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
// import { useForm, UseFormReturn } from 'react-hook-form'
// import { DateTimeList } from '../DateTimeList'
// import type { DateItem } from '../DateTime/types'

// // Test wrapper component to provide form context
// function TestWrapper({
//   children,
//   defaultValues,
//   onSubmit,
// }: {
//   children: (form: UseFormReturn<any>) => React.ReactNode
//   defaultValues?: any
//   onSubmit?: (data: any) => void
// }) {
//   const form = useForm({
//     defaultValues: defaultValues ?? { extraOccurrences: [] },
//     mode: 'onChange',
//   })

//   return (
//     <form onSubmit={form.handleSubmit(onSubmit || (() => {}))}>
//       {children(form)}
//     </form>
//   )
// }

// // Helper to wait for component to stabilize after render
// async function waitForStableRender() {
//   await act(async () => {
//     await new Promise((resolve) => setTimeout(resolve, 0))
//   })
// }

// describe('DateTimeList', () => {
//   describe('Initial Render', () => {
//     it('renders with one blank date row when startWithOne is true', async () => {
//       await act(async () => {
//         render(
//           <TestWrapper>
//             {(form) => (
//               <DateTimeList
//                 form={form}
//                 name="extraOccurrences"
//                 title="Event dates and times"
//               />
//             )}
//           </TestWrapper>
//         )
//       })

//       await waitForStableRender()

//       expect(screen.getByText('Event dates and times')).toBeInTheDocument()
//       await waitFor(() => {
//         expect(screen.getByText('Date 1')).toBeInTheDocument()
//       })
//       expect(screen.getByLabelText(/Date \*/)).toBeInTheDocument()
//       expect(screen.getByLabelText(/Time \*/)).toBeInTheDocument()
//     })

//     it('renders empty when startWithOne is false and form is empty', async () => {
//       await act(async () => {
//         render(
//           <TestWrapper>
//             {(form) => (
//               <DateTimeList
//                 form={form}
//                 name="extraOccurrences"
//                 startWithOne={false}
//               />
//             )}
//           </TestWrapper>
//         )
//       })

//       await waitForStableRender()

//       expect(screen.queryByText('Date 1')).not.toBeInTheDocument()
//       expect(screen.getByText('+ Add another date')).toBeInTheDocument()
//     })

//     it('initializes correctly when form has existing values', async () => {
//       const defaultValues = {
//         extraOccurrences: [
//           {
//             date: '2024-12-25',
//             times: [{ time: '18:00' }],
//           },
//         ],
//       }

//       await act(async () => {
//         render(
//           <TestWrapper defaultValues={defaultValues}>
//             {(form) => (
//               <DateTimeList
//                 form={form}
//                 name="extraOccurrences"
//                 title="Event dates"
//               />
//             )}
//           </TestWrapper>
//         )
//       })

//       await waitForStableRender()

//       await waitFor(() => {
//         const dateInput = screen.getByLabelText(/Date \*/) as HTMLInputElement
//         expect(dateInput.value).toBe('2024-12-25')
//       })

//       const timeInput = screen.getByLabelText(/Time \*/) as HTMLInputElement
//       expect(timeInput.value).toBe('18:00')
//     })

//     it('displays title and note correctly when provided', async () => {
//       await act(async () => {
//         render(
//           <TestWrapper>
//             {(form) => (
//               <DateTimeList
//                 form={form}
//                 name="extraOccurrences"
//                 title="Event Dates"
//                 note="Add your event dates here"
//               />
//             )}
//           </TestWrapper>
//         )
//       })

//       await waitForStableRender()

//       expect(screen.getByText('Event Dates')).toBeInTheDocument()
//       expect(screen.getByText('Add your event dates here')).toBeInTheDocument()
//     })
//   })

//   describe('Add/Remove Dates', () => {
//     it('can add a new date by clicking add button', async () => {
//       render(
//         <TestWrapper>
//           {(form) => (
//             <DateTimeList form={form} name="extraOccurrences" />
//           )}
//         </TestWrapper>
//       )

//       const dateInput = screen.getByLabelText(/Date \*/) as HTMLInputElement
//       fireEvent.change(dateInput, { target: { value: '2024-12-25' } })

//       const timeInput = screen.getByLabelText(/Time \*/) as HTMLInputElement
//       fireEvent.change(timeInput, { target: { value: '18:00' } })

//       const addButton = screen.getByText('+ Add another date')
//       fireEvent.click(addButton)

//       await waitFor(() => {
//         expect(screen.getByText('Date 2')).toBeInTheDocument()
//       })
//     })

//     it('shows error when trying to add date without filling previous date', async () => {
//       render(
//         <TestWrapper>
//           {(form) => (
//             <DateTimeList form={form} name="extraOccurrences" />
//           )}
//         </TestWrapper>
//       )

//       const addButton = screen.getByText('+ Add another date')
//       fireEvent.click(addButton)

//       await waitFor(() => {
//         expect(screen.getByText('Date is required')).toBeInTheDocument()
//       })
//     })

//     it('shows error when trying to add date without filling previous time', async () => {
//       render(
//         <TestWrapper>
//           {(form) => (
//             <DateTimeList form={form} name="extraOccurrences" />
//           )}
//         </TestWrapper>
//       )

//       const dateInput = screen.getByLabelText(/Date \*/) as HTMLInputElement
//       fireEvent.change(dateInput, { target: { value: '2024-12-25' } })

//       const addButton = screen.getByText('+ Add another date')
//       fireEvent.click(addButton)

//       await waitFor(() => {
//         expect(screen.getByText('Time is required')).toBeInTheDocument()
//       })
//     })

//     it('can remove dates except the first one', async () => {
//       render(
//         <TestWrapper>
//           {(form) => (
//             <DateTimeList form={form} name="extraOccurrences" />
//           )}
//         </TestWrapper>
//       )

//       // Add a second date
//       const dateInput = screen.getByLabelText(/Date \*/) as HTMLInputElement
//       fireEvent.change(dateInput, { target: { value: '2024-12-25' } })

//       const timeInput = screen.getByLabelText(/Time \*/) as HTMLInputElement
//       fireEvent.change(timeInput, { target: { value: '18:00' } })

//       const addButton = screen.getByText('+ Add another date')
//       fireEvent.click(addButton)

//       await waitFor(() => {
//         expect(screen.getByText('Date 2')).toBeInTheDocument()
//       })

//       // Remove second date
//       const removeButtons = screen.getAllByText('Remove date')
//       // Second date's remove button (index 1, since first date doesn't have one)
//       fireEvent.click(removeButtons[0])

//       await waitFor(() => {
//         expect(screen.queryByText('Date 2')).not.toBeInTheDocument()
//       })
//     })

//     it('respects maxDates limit', async () => {
//       render(
//         <TestWrapper>
//           {(form) => (
//             <DateTimeList
//               form={form}
//               name="extraOccurrences"
//               maxDates={1}
//             />
//           )}
//         </TestWrapper>
//       )

//       const dateInput = screen.getByLabelText(/Date \*/) as HTMLInputElement
//       fireEvent.change(dateInput, { target: { value: '2024-12-25' } })

//       const timeInput = screen.getByLabelText(/Time \*/) as HTMLInputElement
//       fireEvent.change(timeInput, { target: { value: '18:00' } })

//       expect(screen.queryByText('+ Add another date')).not.toBeInTheDocument()
//     })
//   })

//   describe('Add/Remove Times', () => {
//     it('can add multiple times to a date', async () => {
//       render(
//         <TestWrapper>
//           {(form) => (
//             <DateTimeList form={form} name="extraOccurrences" />
//           )}
//         </TestWrapper>
//       )

//       const addTimeButton = screen.getByText('+ Add another time')
//       fireEvent.click(addTimeButton)

//       await waitFor(() => {
//         expect(screen.getByText('Additional time *')).toBeInTheDocument()
//       })
//     })

//     it('cannot add time if date is empty', async () => {
//       render(
//         <TestWrapper>
//           {(form) => (
//             <DateTimeList form={form} name="extraOccurrences" />
//           )}
//         </TestWrapper>
//       )

//       const addTimeButton = screen.getByText('+ Add another time')
//       fireEvent.click(addTimeButton)

//       await waitFor(() => {
//         expect(screen.getByText('Date is required')).toBeInTheDocument()
//       })
//     })

//     it('cannot add time if previous time is empty', async () => {
//       render(
//         <TestWrapper>
//           {(form) => (
//             <DateTimeList form={form} name="extraOccurrences" />
//           )}
//         </TestWrapper>
//       )

//       const dateInput = screen.getByLabelText(/Date \*/) as HTMLInputElement
//       fireEvent.change(dateInput, { target: { value: '2024-12-25' } })

//       const addTimeButton = screen.getByText('+ Add another time')
//       fireEvent.click(addTimeButton)

//       // First time is still empty, so should show error
//       await waitFor(() => {
//         expect(screen.getByText('Time is required')).toBeInTheDocument()
//       })
//     })

//     it('can remove times except the first one', async () => {
//       render(
//         <TestWrapper>
//           {(form) => (
//             <DateTimeList form={form} name="extraOccurrences" />
//           )}
//         </TestWrapper>
//       )

//       const dateInput = screen.getByLabelText(/Date \*/) as HTMLInputElement
//       fireEvent.change(dateInput, { target: { value: '2024-12-25' } })

//       const timeInput = screen.getByLabelText(/Time \*/) as HTMLInputElement
//       fireEvent.change(timeInput, { target: { value: '18:00' } })

//       const addTimeButton = screen.getByText('+ Add another time')
//       fireEvent.click(addTimeButton)

//       await waitFor(() => {
//         const removeButtons = screen.getAllByText('Remove')
//         expect(removeButtons.length).toBeGreaterThan(0)
        
//         // Remove the additional time
//         fireEvent.click(removeButtons[0])
//       })

//       await waitFor(() => {
//         expect(screen.queryByText('Additional time *')).not.toBeInTheDocument()
//       })
//     })

//     it('respects maxTimesPerDate limit', async () => {
//       render(
//         <TestWrapper>
//           {(form) => (
//             <DateTimeList
//               form={form}
//               name="extraOccurrences"
//               maxTimesPerDate={1}
//             />
//           )}
//         </TestWrapper>
//       )

//       const dateInput = screen.getByLabelText(/Date \*/) as HTMLInputElement
//       fireEvent.change(dateInput, { target: { value: '2024-12-25' } })

//       const timeInput = screen.getByLabelText(/Time \*/) as HTMLInputElement
//       fireEvent.change(timeInput, { target: { value: '18:00' } })

//       expect(screen.queryByText('+ Add another time')).not.toBeInTheDocument()
//     })
//   })

//   describe('Sync Times Toggle', () => {
//     it('shows sync toggle when conditions are met', async () => {
//       render(
//         <TestWrapper>
//           {(form) => (
//             <DateTimeList form={form} name="extraOccurrences" />
//           )}
//         </TestWrapper>
//       )

//       // Initially no toggle (only one date)
//       expect(screen.queryByText('Same times for all dates')).not.toBeInTheDocument()

//       // Add second date
//       const dateInput = screen.getByLabelText(/Date \*/) as HTMLInputElement
//       fireEvent.change(dateInput, { target: { value: '2024-12-25' } })

//       const timeInput = screen.getByLabelText(/Time \*/) as HTMLInputElement
//       fireEvent.change(timeInput, { target: { value: '18:00' } })

//       const addButton = screen.getByText('+ Add another date')
//       fireEvent.click(addButton)

//       await waitFor(() => {
//         expect(screen.getByText('Same times for all dates')).toBeInTheDocument()
//       })
//     })

//     it('syncs times when toggle is enabled', async () => {
//       render(
//         <TestWrapper>
//           {(form) => (
//             <DateTimeList form={form} name="extraOccurrences" />
//           )}
//         </TestWrapper>
//       )

//       // Set up first date
//       const dateInput1 = screen.getByLabelText(/Date \*/) as HTMLInputElement
//       fireEvent.change(dateInput1, { target: { value: '2024-12-25' } })

//       const timeInput1 = screen.getByLabelText(/Time \*/) as HTMLInputElement
//       fireEvent.change(timeInput1, { target: { value: '18:00' } })

//       // Add second date
//       const addButton = screen.getByText('+ Add another date')
//       fireEvent.click(addButton)

//       await waitFor(() => {
//         expect(screen.getByText('Same times for all dates')).toBeInTheDocument()
//       })

//       // Enable sync
//       const syncCheckbox = screen.getByLabelText('Same times for all dates')
//       fireEvent.click(syncCheckbox)

//       await waitFor(() => {
//         const timeInputs = screen.getAllByLabelText(/Time \*/) as HTMLInputElement[]
//         expect(timeInputs[1].value).toBe('18:00')
//       })
//     })

//     it('updates all dates when first date time changes with sync enabled', async () => {
//       render(
//         <TestWrapper>
//           {(form) => (
//             <DateTimeList form={form} name="extraOccurrences" />
//           )}
//         </TestWrapper>
//       )

//       // Set up two dates
//       const dateInput1 = screen.getByLabelText(/Date \*/) as HTMLInputElement
//       fireEvent.change(dateInput1, { target: { value: '2024-12-25' } })

//       const timeInput1 = screen.getByLabelText(/Time \*/) as HTMLInputElement
//       fireEvent.change(timeInput1, { target: { value: '18:00' } })

//       const addButton = screen.getByText('+ Add another date')
//       fireEvent.click(addButton)

//       await waitFor(() => {
//         expect(screen.getByText('Date 2')).toBeInTheDocument()
//       })

//       // Enable sync
//       const syncCheckbox = screen.getByLabelText('Same times for all dates')
//       fireEvent.click(syncCheckbox)

//       // Change first date time
//       fireEvent.change(timeInput1, { target: { value: '20:00' } })

//       await waitFor(() => {
//         const timeInputs = screen.getAllByLabelText(/Time \*/) as HTMLInputElement[]
//         expect(timeInputs[1].value).toBe('20:00')
//       })
//     })
//   })

//   describe('External setValue (Critical)', () => {
//     it('syncs correctly when form.setValue is called externally', async () => {
//       let formInstance: UseFormReturn<any> | null = null

//       render(
//         <TestWrapper>
//           {(form) => {
//             formInstance = form
//             return <DateTimeList form={form} name="extraOccurrences" />
//           }}
//         </TestWrapper>
//       )

//       // Wait for initial render
//       await waitFor(() => {
//         expect(screen.getByText('Date 1')).toBeInTheDocument()
//       })

//       // Set value externally (simulating OrganizerDatesTimes scenario)
//       const externalValues: DateItem[] = [
//         {
//           date: '2024-12-25',
//           times: [{ time: '18:00' }],
//         },
//         {
//           date: '2024-12-26',
//           times: [{ time: '19:00' }],
//         },
//       ]

//       formInstance!.setValue('extraOccurrences', externalValues, {
//         shouldDirty: true,
//         shouldTouch: false,
//         shouldValidate: false,
//       })

//       await waitFor(() => {
//         expect(screen.getByText('Date 2')).toBeInTheDocument()
        
//         const dateInputs = screen.getAllByLabelText(/Date \*/) as HTMLInputElement[]
//         expect(dateInputs[0].value).toBe('2024-12-25')
//         expect(dateInputs[1].value).toBe('2024-12-26')

//         const timeInputs = screen.getAllByLabelText(/Time \*/) as HTMLInputElement[]
//         expect(timeInputs[0].value).toBe('18:00')
//         expect(timeInputs[1].value).toBe('19:00')
//       })
//     })

//     it('preserves user typing when external setValue occurs', async () => {
//       let formInstance: UseFormReturn<any> | null = null

//       render(
//         <TestWrapper>
//           {(form) => {
//             formInstance = form
//             return <DateTimeList form={form} name="extraOccurrences" />
//           }}
//         </TestWrapper>
//       )

//       await waitFor(() => {
//         expect(screen.getByText('Date 1')).toBeInTheDocument()
//       })

//       // User starts typing
//       const dateInput = screen.getByLabelText(/Date \*/) as HTMLInputElement
//       fireEvent.change(dateInput, { target: { value: '2024-12-25' } })

//       // External setValue happens while user is typing
//       const externalValues: DateItem[] = [
//         {
//           date: '2024-12-25',
//           times: [{ time: '18:00' }],
//         },
//       ]

//       formInstance!.setValue('extraOccurrences', externalValues)

//       // Should preserve user's typing (same value)
//       await waitFor(() => {
//         expect(dateInput.value).toBe('2024-12-25')
//       })
//     })
//   })

//   describe('Date-Only Mode', () => {
//     it('hides time fields when showTime is false', () => {
//       render(
//         <TestWrapper>
//           {(form) => (
//             <DateTimeList
//               form={form}
//               name="extraOccurrences"
//               showTime={false}
//             />
//           )}
//         </TestWrapper>
//       )

//       expect(screen.queryByLabelText(/Time \*/)).not.toBeInTheDocument()
//       expect(screen.getByLabelText(/Date \*/)).toBeInTheDocument()
//     })

//     it('can add multiple dates without times', async () => {
//       render(
//         <TestWrapper>
//           {(form) => (
//             <DateTimeList
//               form={form}
//               name="extraOccurrences"
//               showTime={false}
//             />
//           )}
//         </TestWrapper>
//       )

//       const dateInput = screen.getByLabelText(/Date \*/) as HTMLInputElement
//       fireEvent.change(dateInput, { target: { value: '2024-12-25' } })

//       const addButton = screen.getByText('+ Add another date')
//       fireEvent.click(addButton)

//       await waitFor(() => {
//         expect(screen.getByText('Date 2')).toBeInTheDocument()
//       })
//     })
//   })

//   describe('Location Configuration', () => {
//     const locationConfig = {
//       addressName: 'address',
//       venueName: 'venue',
//       label: 'Location',
//     }

//     it('shows location sync toggle when locationConfig is provided', () => {
//       render(
//         <TestWrapper>
//           {(form) => (
//             <DateTimeList
//               form={form}
//               name="extraOccurrences"
//               locationConfig={locationConfig}
//             />
//           )}
//         </TestWrapper>
//       )

//       expect(screen.getByText('Same location for all dates')).toBeInTheDocument()
//     })

//     it('shows single location field when sync is enabled', () => {
//       render(
//         <TestWrapper>
//           {(form) => (
//             <DateTimeList
//               form={form}
//               name="extraOccurrences"
//               locationConfig={locationConfig}
//             />
//           )}
//         </TestWrapper>
//       )

//       expect(screen.getByText('Location')).toBeInTheDocument()
//       // Should have address input
//       const inputs = screen.getAllByRole('textbox')
//       expect(inputs.length).toBeGreaterThan(0)
//     })
//   })

//   describe('Error Handling', () => {
//     it('handles empty form values gracefully', () => {
//       render(
//         <TestWrapper defaultValues={{ extraOccurrences: [] }}>
//           {(form) => (
//             <DateTimeList
//               form={form}
//               name="extraOccurrences"
//               startWithOne={true}
//             />
//           )}
//         </TestWrapper>
//       )

//       expect(screen.getByText('Date 1')).toBeInTheDocument()
//     })

//     it('handles missing times array in existing data', async () => {
//       const defaultValues = {
//         extraOccurrences: [
//           {
//             date: '2024-12-25',
//             // Missing times array
//           },
//         ],
//       }

//       render(
//         <TestWrapper defaultValues={defaultValues}>
//           {(form) => (
//             <DateTimeList form={form} name="extraOccurrences" />
//           )}
//         </TestWrapper>
//       )

//       await waitFor(() => {
//         expect(screen.getByText('Date 1')).toBeInTheDocument()
//         // Should have created a default time row
//         expect(screen.getByLabelText(/Time \*/)).toBeInTheDocument()
//       })
//     })
//   })

//   describe('Validation', () => {
//     it('shows error for empty date when trying to submit', async () => {
//       const onSubmit = jest.fn()

//       render(
//         <TestWrapper onSubmit={onSubmit}>
//           {(form) => (
//             <form onSubmit={form.handleSubmit(onSubmit)}>
//               <DateTimeList
//                 form={form}
//                 name="extraOccurrences"
//                 errorMode="always"
//               />
//               <button type="submit">Submit</button>
//             </form>
//           )}
//         </TestWrapper>
//       )

//       const submitButton = screen.getByText('Submit')
//       fireEvent.click(submitButton)

//       await waitFor(() => {
//         expect(screen.getByText(/required/i)).toBeInTheDocument()
//       })
//     })
//   })

//   describe('Edge Cases', () => {
//     it('handles rapid add/remove operations', async () => {
//       render(
//         <TestWrapper>
//           {(form) => (
//             <DateTimeList form={form} name="extraOccurrences" />
//           )}
//         </TestWrapper>
//       )

//       const dateInput = screen.getByLabelText(/Date \*/) as HTMLInputElement
//       fireEvent.change(dateInput, { target: { value: '2024-12-25' } })

//       const timeInput = screen.getByLabelText(/Time \*/) as HTMLInputElement
//       fireEvent.change(timeInput, { target: { value: '18:00' } })

//       const addButton = screen.getByText('+ Add another date')

//       // Rapidly add dates
//       fireEvent.click(addButton)
//       fireEvent.click(addButton)
//       fireEvent.click(addButton)

//       await waitFor(() => {
//         expect(screen.getByText('Date 4')).toBeInTheDocument()
//       }, { timeout: 3000 })
//     })
//   })
// })

