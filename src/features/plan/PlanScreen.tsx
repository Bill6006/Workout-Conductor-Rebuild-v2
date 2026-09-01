import { useState } from 'react';
import { Screen } from '../../components/Screen/Screen';
import { PhaseCard } from '../../components/PhaseCard/PhaseCard';
import { ChipGroup, Field } from '../../components/form/controls';
import {
  EQUIPMENT_GROUPS,
  EQUIPMENT_GROUP_IDS,
  equipmentInGroup,
  type EquipmentId,
} from '../../core/model/equipment';
import type { LocationProfile, Profile } from '../../core/model/profile';
import { useUpdateProfile } from '../../core/state/useProfile';
import styles from './PlanScreen.module.css';

/** Stable-ish id for a new location without pulling in a uuid dependency. */
function locationId(name: string, existing: readonly LocationProfile[]): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'location';
  let candidate = base;
  let suffix = 2;
  while (existing.some((location) => location.id === candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

function LocationEditor({
  location,
  profile,
  onChange,
  onDelete,
  onSetActive,
}: {
  location: LocationProfile;
  profile: Profile;
  onChange: (next: LocationProfile) => void;
  onDelete: () => void;
  onSetActive: () => void;
}) {
  const [open, setOpen] = useState(false);
  const isActive = profile.activeLocationId === location.id;

  const toggle = (id: EquipmentId) => {
    const next = location.equipment.includes(id)
      ? location.equipment.filter((existing) => existing !== id)
      : [...location.equipment, id];
    onChange({ ...location, equipment: next });
  };

  return (
    <article className={styles.location} data-open={open ? 'true' : 'false'}>
      <div className={styles.locationHead}>
        <button
          type="button"
          className={styles.locationToggle}
          onClick={() => setOpen((current) => !current)}
          aria-expanded={open}
          data-testid={`location-${location.id}`}
        >
          <span className={styles.locationBody}>
            <span className={styles.locationName}>
              {location.name}
              {isActive ? <span className="wc-pill wc-pill--accent">Active</span> : null}
            </span>
            <span className={styles.locationMeta}>
              {location.equipment.length} item{location.equipment.length === 1 ? '' : 's'}
            </span>
          </span>
          <svg
            className={styles.chevron}
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      </div>

      {open ? (
        <div className={styles.locationPanel}>
          {EQUIPMENT_GROUP_IDS.map((groupId) => (
            <div className={styles.group} key={groupId}>
              <div className={styles.groupTitle}>{EQUIPMENT_GROUPS[groupId]}</div>
              <ChipGroup
                name={`${location.name} — ${EQUIPMENT_GROUPS[groupId]}`}
                options={equipmentInGroup(groupId).map((item) => ({
                  id: item.id,
                  label: item.label,
                }))}
                values={location.equipment}
                onToggle={toggle}
              />
            </div>
          ))}

          <div className={styles.locationActions}>
            {!isActive ? (
              <button
                type="button"
                className="wc-button wc-button--secondary wc-button--block"
                onClick={onSetActive}
                data-testid={`location-activate-${location.id}`}
              >
                Train here today
              </button>
            ) : null}
            {!location.builtIn ? (
              <button type="button" className={styles.delete} onClick={onDelete}>
                Delete this location
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </article>
  );
}

export function PlanScreen({ profile }: { profile: Profile }) {
  const update = useUpdateProfile();
  const [newName, setNewName] = useState('');

  const replaceLocation = (next: LocationProfile) => {
    void update({
      locations: profile.locations.map((location) => (location.id === next.id ? next : location)),
    });
  };

  const addLocation = () => {
    const name = newName.trim();
    if (!name) return;
    const id = locationId(name, profile.locations);
    void update({ locations: [...profile.locations, { id, name, equipment: [], builtIn: false }] });
    setNewName('');
  };

  const deleteLocation = (id: string) => {
    const remaining = profile.locations.filter((location) => location.id !== id);
    if (remaining.length === 0) return;
    void update({
      locations: remaining,
      // Never leave the active pointer dangling.
      activeLocationId:
        profile.activeLocationId === id ? remaining[0]!.id : profile.activeLocationId,
    });
  };

  return (
    <Screen
      eyebrow="Plan"
      title="The week ahead"
      lede="Where upcoming sessions, weekly muscle targets and your saved profiles live."
    >
      <Field
        label="Location profiles"
        hint="Each location only offers the equipment you have there. Switching location re-plans the session."
      >
        <div className={styles.locations}>
          {profile.locations.map((location) => (
            <LocationEditor
              key={location.id}
              location={location}
              profile={profile}
              onChange={replaceLocation}
              onDelete={() => deleteLocation(location.id)}
              onSetActive={() => void update({ activeLocationId: location.id })}
            />
          ))}
        </div>

        <div className={styles.addRow}>
          <input
            className={styles.addInput}
            value={newName}
            onChange={(event) => setNewName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                addLocation();
              }
            }}
            placeholder="Add a location, e.g. Hotel gym"
            aria-label="New location name"
            maxLength={40}
            data-testid="location-new-name"
          />
          <button
            type="button"
            className={styles.addButton}
            onClick={addLocation}
            disabled={newName.trim().length === 0}
            data-testid="location-add"
          >
            Add
          </button>
        </div>
      </Field>

      <PhaseCard
        phase="Phase 7"
        title="Weekly targets and planning"
        description="Planned training days, weekly muscle targets, recovery balance, and the saved workouts you want to repeat."
        items={['Training days', 'Muscle targets', 'Recovery balance']}
      />
    </Screen>
  );
}
