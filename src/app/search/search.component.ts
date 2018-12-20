import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { select, Store } from '@ngrx/store';
import * as FeatuerStore from 'feature-store';
import { Observable, Subscription } from 'rxjs';
import { filter, map, startWith, tap, withLatestFrom } from 'rxjs/operators';
@Component({
  selector: 'spa-search',
  templateUrl: './search.component.html',
  styleUrls: ['./search.component.scss']
})
export class SearchComponent implements OnInit, OnDestroy {
  fromAirports$: Observable<FeatuerStore.Airport[]>;
  toAirports$: Observable<FeatuerStore.Airport[]>;
  searchForm: FormGroup;
  statusSubscription: Subscription;

  get fromCtrl() {
    return this.searchForm
      .get('flightDetailsGroup.fromCtrl') as FormControl;
  }

  get toCtrl() {
    return this.searchForm
      .get('flightDetailsGroup.toCtrl') as FormControl;
  }

  constructor(private store: Store<FeatuerStore.ConfigData>, private fb: FormBuilder) {
    this.searchForm = this.fb.group({
      flightDetailsGroup: this.fb.group({
        fromCtrl: ['', [Validators.required]],
        toCtrl: ['', [Validators.required]]
      }),
    });

    this.fromAirports$ = this.fromCtrl.valueChanges
      .pipe(
        startWith(''),
        withLatestFrom(this.store.pipe(
          select(FeatuerStore.selectAirports)
        ), (typeAheadText, airports) => ({ typeAheadText, airports })),
        map(data => {
          return data.typeAheadText ?
            this._filterAirport(data.typeAheadText, data.airports) :
            data.airports.slice();
        })
      );

    this.toAirports$ = this.toCtrl.valueChanges
      .pipe(
        startWith(''),
        withLatestFrom(this.store.pipe(
          select(FeatuerStore.selectAirports)
        ), (typeAheadText, airports) => ({ typeAheadText, airports })),
        map(data => {
          return data.typeAheadText ?
            this._filterAirport(data.typeAheadText, data.airports) :
            data.airports.slice();
        })
      );

    this.statusSubscription = this.searchForm.statusChanges.pipe(
      filter((status) => {
        return status === 'VALID';
      }),
      withLatestFrom(this.searchForm.valueChanges, (status, value) => {
        return ({ status, value });
      }),
      tap((data) => {
        const flightDetails: FeatuerStore.FlightSearchDetail = {
          from: data.value.flightDetailsGroup.fromCtrl,
          to: data.value.flightDetailsGroup.toCtrl,
          startDate: new Date(Date.now()),
          travelOrder: 1,
          startAfterTime: { hours: 0, minutes: 0 },
          startBeforeTime: { hours: 0, minutes: 0 }
        };
        this.store.dispatch(new FeatuerStore.UpsertFlightSearchDetails(flightDetails));
      })
    ).subscribe();
  }

  ngOnInit() {

  }

  ngOnDestroy() {
    this.statusSubscription.unsubscribe();
  }

  private _filterAirport(value: string, airports: FeatuerStore.Airport[]): FeatuerStore.Airport[] {
    const filterValue = value.toLowerCase();
    return airports.filter(airport =>
      airport.code.toLowerCase().indexOf(filterValue) >= 0 ||
      airport.city.toLowerCase().indexOf(filterValue) >= 0 ||
      airport.name.toLowerCase().indexOf(filterValue) >= 0
    );
  }
}