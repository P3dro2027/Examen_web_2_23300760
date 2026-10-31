import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Rh } from './rh';

describe('Rh', () => {
  let component: Rh;
  let fixture: ComponentFixture<Rh>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Rh],
    }).compileComponents();

    fixture = TestBed.createComponent(Rh);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
