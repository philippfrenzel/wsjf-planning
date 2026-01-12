import { Button } from '@/components/ui/button';
import { EyeIcon, EyeOffIcon } from 'lucide-react';

interface ArchiveToggleProps {
    showArchived: boolean;
    toggleArchived: () => void;
}

export default function ArchiveToggle({ showArchived, toggleArchived }: ArchiveToggleProps) {
    return (
        <Button variant="secondary" size="sm" onClick={toggleArchived} className="text-gray-600">
            {showArchived ? (
                <>
                    <EyeOffIcon className="mr-1 h-4 w-4" />
                    Archivierte ausblenden
                </>
            ) : (
                <>
                    <EyeIcon className="mr-1 h-4 w-4" />
                    Archivierte anzeigen
                </>
            )}
        </Button>
    );
}
