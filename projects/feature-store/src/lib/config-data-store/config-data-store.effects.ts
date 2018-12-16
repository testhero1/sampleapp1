import { Injectable } from '@angular/core';
import { Actions, Effect, ofType, UpdateEffects, UPDATE_EFFECTS } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, filter, flatMap, map, switchMap } from 'rxjs/operators';
import * as ConfigStoreActions from './config-data-store.actions';
import { Airport } from './config-data-store.models';
import { ConfigDataStoreService } from './config-data-store.service';

let nextConfigDataEffectsId = 1;

export function ResetNextConfigDataEffectsId() {
    nextConfigDataEffectsId = 1;
}
@Injectable({
    providedIn: 'root'
})
export class ConfigDataEffects {

    @Effect()
    loadAirports$ = this.actions$.pipe(
        ofType<ConfigStoreActions.LoadAirports>(ConfigStoreActions.ConfigDataActionTypes.LoadAirports),
        switchMap((_action) => {
            return this.configService.getAirports().pipe(
                map((airports: Airport[]) => {
                    return new ConfigStoreActions.LoadAirportsSuccess(airports);
                }),
                catchError(_err => {
                    return of(new ConfigStoreActions.LoadAirportsFailuer());
                }));
        })
    );

    @Effect()
    loadConfigData$ = this.actions$.pipe(
        ofType<ConfigStoreActions.LoadConfig>(ConfigStoreActions.ConfigDataActionTypes.LoadConfig),
        flatMap((_action) => {
            return [new ConfigStoreActions.LoadAirports()];
        })
    );

    @Effect()
    init$ = this.actions$.pipe(
        ofType<UpdateEffects>(UPDATE_EFFECTS),
        filter(action => action.effects.includes('ConfigDataEffects')),
        map(_action => new ConfigStoreActions.LoadConfig())
    );

    constructor(
        private actions$: Actions<ConfigStoreActions.ConfigDataActionsUnion>,
        private configService: ConfigDataStoreService
    ) {
        const id = nextConfigDataEffectsId++;
        if (id > 1) {
            throw new Error(
                'ConfigDataEffects is already loaded. Import it in the AppModule only');
        }
    }
}