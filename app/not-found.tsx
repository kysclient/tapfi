import { Button } from '@/components/ui/button'
import Link from 'next/link'
 
export default function NotFound() {
  return (
       <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold text-primary">404 Not found.</h1>
        <p className="text-muted-foreground">Could not find requested resource.</p>
        <div className="space-x-4">
          <Button className='text-white' asChild>
            <Link href="/">Return Home</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
