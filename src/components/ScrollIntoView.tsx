export const ScrollIntoView = (ref:  React.RefObject<HTMLDivElement>) => {
  if(ref && ref.current)
  {ref.current.scrollIntoView({ behavior: "smooth" })}
 }
