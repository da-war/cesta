import { Platform } from 'react-native';
import {
  requestTrackingPermissionsAsync,
  getTrackingPermissionsAsync,
  PermissionStatus,
} from 'expo-tracking-transparency';
import { supabase } from './supabase';

export type TrackingStatus = 'granted' | 'denied' | 'undetermined' | 'restricted' | 'unavailable';

/**
 * Request ATT permission on iOS. Returns the resolved status.
 * On Android / web, returns 'unavailable'.
 *
 * Call this AFTER the user has logged in and AFTER showing them what we use it for.
 * Apple rejects apps that show the prompt without explanation.
 */
export async function requestTrackingPermission(): Promise<TrackingStatus> {
  if (Platform.OS !== 'ios') return 'unavailable';
  try {
    const current = await getTrackingPermissionsAsync();
    if (current.status !== PermissionStatus.UNDETERMINED) {
      return mapStatus(current.status);
    }
    const result = await requestTrackingPermissionsAsync();
    const status = mapStatus(result.status);
    // Record consent in Supabase
    try {
      await supabase.rpc('record_consent', {
        p_type: 'tracking',
        p_granted: status === 'granted',
      });
    } catch (e) {
      console.warn('[tracking] failed to record consent', e);
    }
    return status;
  } catch (e) {
    console.warn('[tracking] permission request failed', e);
    return 'undetermined';
  }
}

export async function getTrackingStatus(): Promise<TrackingStatus> {
  if (Platform.OS !== 'ios') return 'unavailable';
  try {
    const current = await getTrackingPermissionsAsync();
    return mapStatus(current.status);
  } catch {
    return 'undetermined';
  }
}

function mapStatus(status: PermissionStatus): TrackingStatus {
  switch (status) {
    case PermissionStatus.GRANTED: return 'granted';
    case PermissionStatus.DENIED: return 'denied';
    case PermissionStatus.UNDETERMINED: return 'undetermined';
    default: return 'restricted';
  }
}
