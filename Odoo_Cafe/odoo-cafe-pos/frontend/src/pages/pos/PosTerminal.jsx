import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { usePosStore } from '../../store/posStore'
import { PageLoader } from '../../components/ui'

export default function PosTerminal() {
  const navigate = useNavigate()
  const { activeOrder } = usePosStore()

  useEffect(() => {
    // PosLayout handles session fetch + floor popup
    // This route just redirects to order view
    navigate('/pos/order', { replace: true })
  }, [])

  return <PageLoader />
}
