// // components/FormView.tsx
// "use client";

// import { useState } from "react";
// import { FormSchema } from "@/lib/components/views/form/form";

// interface FormViewProps {
//   schema: FormSchema;
//   initialValues?: Record<string, any>;
//   onSubmit: (data: Record<string, any>) => void;
// }

// export default function FormView({ schema, initialValues = {}, onSubmit }: FormViewProps) {
//   const [formData, setFormData] = useState<Record<string, any>>(initialValues);

//   const handleChange = (name: string, value: any) => {
//     setFormData(prev => ({ ...prev, [name]: value }));
//   };

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     onSubmit(formData);
//   };

//   return (
//     <form onSubmit={handleSubmit} className="space-y-4 p-4 bg-white rounded-xl shadow">
//       {schema.title && <h2 className="text-xl font-semibold">{schema.title}</h2>}

//       {schema.fields.map(field => (
//         <div key={field.name} className="flex flex-col">
//           <label className="mb-1 text-sm font-medium text-gray-700">{field.label}</label>

//           {field.type === "text" && (
//             <input
//               type="text"
//               required={field.required}
//               placeholder={field.placeholder}
//               value={formData[field.name] || ""}
//               onChange={e => handleChange(field.name, e.target.value)}
//               className="p-2 border rounded-lg"
//             />
//           )}

//           {field.type === "textarea" && (
//             <textarea
//               required={field.required}
//               placeholder={field.placeholder}
//               value={formData[field.name] || ""}
//               onChange={e => handleChange(field.name, e.target.value)}
//               className="p-2 border rounded-lg"
//             />
//           )}

//           {field.type === "number" && (
//             <input
//               type="number"
//               required={field.required}
//               value={formData[field.name] || ""}
//               onChange={e => handleChange(field.name, Number(e.target.value))}
//               className="p-2 border rounded-lg"
//             />
//           )}

//           {field.type === "date" && (
//             <input
//               type="date"
//               required={field.required}
//               value={formData[field.name] || ""}
//               onChange={e => handleChange(field.name, e.target.value)}
//               className="p-2 border rounded-lg"
//             />
//           )}

//           {field.type === "checkbox" && (
//             <input
//               type="checkbox"
//               checked={formData[field.name] || false}
//               onChange={e => handleChange(field.name, e.target.checked)}
//               className="h-4 w-4"
//             />
//           )}

//           {field.type === "select" && (
//             <select
//               required={field.required}
//               value={formData[field.name] || ""}
//               onChange={e => handleChange(field.name, e.target.value)}
//               className="p-2 border rounded-lg"
//             >
//               <option value="">Select...</option>
//               {field.options?.map(opt => (
//                 <option key={opt.value} value={opt.value}>
//                   {opt.label}
//                 </option>
//               ))}
//             </select>
//           )}
//         </div>
//       ))}

//       <button
//         type="submit"
//         className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
//       >
//         {schema.submitLabel || "Submit"}
//       </button>
//     </form>
//   );
// }
