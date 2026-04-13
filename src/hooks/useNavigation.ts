import { useQuery } from '@tanstack/react-query';
import { navigationService } from '../api/navigationService';

const KEYS = {
  myDrive: (page: number, size: number) => ['myDrive', page, size] as const,
  folderContents: (parentId: string, page: number, size: number) => ['folderContents', parentId, page, size] as const,
};

export function useMyDrive(page = 0, size = 25) {
  return useQuery({
    queryKey: KEYS.myDrive(page, size),
    queryFn: () => navigationService.getMyDrive(page, size),
  });
}

export function useFolderContents(parentId: string, page = 0, size = 25) {
  return useQuery({
    queryKey: KEYS.folderContents(parentId, page, size),
    queryFn: () => navigationService.getFolderContents(parentId, page, size),
    enabled: !!parentId,
  });
}
