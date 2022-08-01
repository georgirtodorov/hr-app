import {Component, OnInit, NgModule, AfterViewInit} from '@angular/core';
import {SickLeaveService} from '../../../services/pages/sick-leave/sick-leave.service'
import {RegisterSickLeaveComponent} from './register-sick-leave/register-sick-leave.component'
import {MatDialog} from '@angular/material/dialog';
import {SwalService} from "../../../services/helpers/swal/swal.service";
import {PageEvent} from "@angular/material/paginator";
import {trigger, style, animate, transition} from '@angular/animations';

declare var $: any;


@Component({
    selector: 'sick-leave',
    templateUrl: './sick-leave.component.html',
    styleUrls: ['./sick-leave.component.scss'],
    animations: [
        trigger(
            'enterFromRight', [
                transition(':enter', [
                    style({transform: 'translateX(100%)', opacity: 0}),
                    animate('500ms', style({transform: 'translateX(0)', opacity: 1}))
                ]),
                transition(':leave', [
                    style({transform: 'translateX(0)', opacity: 1}),
                    animate('500ms', style({transform: 'translateX(100%)', opacity: 0}))
                ])
            ]
        ),
        trigger(
            'enterFromBottom', [
                transition(':enter', [
                    style({transform: 'translateY(100%)', opacity: 0}),
                    animate('500ms', style({transform: 'translateX(0)', opacity: 1}))
                ]),
                transition(':leave', [
                    style({transform: 'translateY(0)', opacity: 1}),
                    animate('500ms', style({transform: 'translateX(100%)', opacity: 0}))
                ])
            ]
        ),
        trigger(
            'enterFromTop', [
                transition(':enter', [
                    style({transform: 'translateY(0)', opacity: 0}),
                    animate('500ms', style({transform: 'translateX(0)', opacity: 1}))
                ]),
                transition(':leave', [
                    style({transform: 'translateY(100%)', opacity: 1}),
                    animate('500ms', style({transform: 'translateX(100%)', opacity: 0}))
                ])
            ]
        )
    ],
})
export class SickLeaveComponent implements OnInit {

    public columns = [
        ['first_name', 'Име'],
        ['last_name', 'Фамилия'],
        ['position', 'Позиция'],
        ['department', 'Департамент'],
        ['location', 'Локация'],
        ['start_date', 'Начална дата'],
        ['end_date', 'Крайна дата'],
        ['days', 'Дни'],
        ['cost', 'Разход'],
        ['actions', 'Опции'],
    ]

    public searchable = {
        'alphabetical': [
            'first_name',
            'last_name',
            'position',
            'department',
            'location'
        ],
        'dates': [
            'start_date',
            'end_date'
        ]
    }


    public sick_leave = {
        'current_year': [],
        'past_years': [],
    }

    public summarized = {
        'current_year': {
            'days': 0,
            'cost': 0,
        },
        'past_years': {
            'days': 0,
            'cost': 0,
        }
    }

    public filter = {
        'current_year': {
            'first_name': '',
            'last_name': '',
            'position': '',
            'department': '',
            'location': '',
            'start_date': '',
            'end_date': '',
        },
        'past_years': {
            'first_name': '',
            'last_name': '',
            'position': '',
            'department': '',
            'location': '',
            'start_date': '',
            'end_date': '',
        }
    };

    public sort = {
        'current_year': {
            'field': 'end_date',
            'action': 'descending'
        },
        'past_years': {
            'field': 'end_date',
            'action': 'descending'
        },
    };

    public search = {
        'current_year': false,
        'past_years': false
    };

    public pagination: PageEvent = {
        pageIndex: 0,
        pageSize: 5,
        length: 10
    };

    public loading = true;

    constructor(
        private sick_leave_service: SickLeaveService,
        private dialog: MatDialog,
        private swal_service: SwalService
    ) {
    }

    ngOnInit(): void {
        this.get();
        setTimeout(() => {
            this.loading = false;
        }, 500);
        setTimeout(() => {
            this.checkOngoing();
            this.checkFuture();
        }, 2000);
    }

    private get(): void {
        this.sick_leave_service.get().subscribe(
            leave_requests => {
                this.formatSickLeave(leave_requests);
                this.initSummarizedData();
            }
        )
    }

    private formatSickLeave(sick_leave): any {
        this.sick_leave.current_year = sick_leave.filter(r => {
            return +new Date(r.end_date).getFullYear() >= +new Date().getFullYear();
        });
        this.sick_leave.past_years = sick_leave.filter(r => {
            return new Date(r.end_date).getFullYear() < new Date().getFullYear();
        })
    };

    private initSummarizedData(): void {
        this.summarized.current_year.cost = 0;
        this.summarized.past_years.cost = 0;

        this.sick_leave.current_year.forEach(s => {
            this.summarized.current_year.cost += s.cost;
            this.summarized.current_year.days += s.days;
        })

        this.sick_leave.past_years.forEach(s => {
            this.summarized.past_years.cost += s.cost;
            this.summarized.past_years.days += s.days;
        })
    };

    private checkFuture(): void {
        let future_sick_leave = this.sick_leave.current_year.filter(e => {
            return new Date(e.end_date) > new Date() && new Date(e.start_date) > new Date();
        })
        if (future_sick_leave.length > 0) {
            this.showNotification('primary', future_sick_leave);
        }
    };

    private checkOngoing(): void {
        let ongoing_sick_leave = this.sick_leave.current_year.filter(e => {
            return new Date(e.end_date) > new Date() && new Date(e.start_date) < new Date();
        })
        ongoing_sick_leave.length > 0 ? this.showNotification('warning', ongoing_sick_leave) : this.showNotification('info');
    };

    private showNotification(type: string, sick_leave?: any): any {
        let message = this.getNotificationMessage(type, sick_leave);
        (type == 'add' || type == 'edit') ? type = 'success' : '';

        $.notify({
            icon: "notifications",
            message: message
        }, {
            type: type,
            timer: 2000,
            placement: {
                from: "top",
                align: "right"
            },
            template:
                '<div data-notify="container" class="col-xl-4 col-lg-4 col-11 col-sm-4 col-md-4 alert alert-{0} alert-with-icon" role="alert">' +
                '<button mat-button  type="button" aria-hidden="true" class="close mat-button" data-notify="dismiss">  <i class="material-icons">close</i></button>' +
                '<i class="material-icons" data-notify="icon">notifications</i> ' +
                '<span data-notify="title">{1}</span> ' +
                '<span data-notify="message">{2}</span>' +
                '<div class="progress" data-notify="progressbar">' +
                '<div class="progress-bar progress-bar-{0}" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%;"></div>' +
                '</div>' +
                '<a href="{3}" target="{4}" data-notify="url"></a>' +
                '</div>'
        });
    };

    private getNotificationMessage(type: string, sick_leave?: any): string {
        let message = 'Към текущия момент нямате служители във временна нетрудоспособност.';
        switch (type) {
            case 'warning':
                message = `Към днешна дата имате ${sick_leave.length} служител${sick_leave.length == 1 ? "" : "я"} във временна нетрудоспособност:`;
                message += sick_leave.map(s => {
                    return `<br>${s.first_name} ${s.last_name} (${s.position})`;
                });
                return message;
                break;
            case 'primary':
                message = `Очквате ${sick_leave.length} служител${sick_leave.length == 1 ? "" : "я"} да отсъства${sick_leave.length == 1 ? "" : "т"}  по здравословни причини в бъдещи периоди:`;
                message += sick_leave.map(s => {
                    return `<br>${s.first_name} ${s.last_name} (${s.position})`;
                });
                return message;
                break;
            case 'add':
                message = 'Успешно регистрирахте болничен лист на:';
                message += `<br>${sick_leave['employee'][0]['first_name']} ${sick_leave['employee'][0]['last_name']} (${sick_leave['employee'][0]['position']})`;
                message += `<br>за периода от ${sick_leave['sick_leave']['start_date']} до ${sick_leave['sick_leave']['end_date']}`;

                return message;
                break;
            case 'edit':
                message = 'Успешно променихте болничния лист на:';
                message += `<br>${sick_leave['employee'][0]['first_name']} ${sick_leave['employee'][0]['last_name']} (${sick_leave['employee'][0]['position']})`;
                message += `<br>за периода от ${sick_leave['sick_leave']['start_date']} до ${sick_leave['sick_leave']['end_date']}`;

                return message;
                break;
            case 'danger':
                message = 'Възникна проблем, моля обърнете се към системния администратор.';
                return
                break;
            case 'info':
                return message;
                break;
            default:
                break;
        }
    };

    public add(): void {
        let dialogRef = this.dialog.open(RegisterSickLeaveComponent, {
            data: {},
            autoFocus: false,
            disableClose: false
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result && result != 'cancel') {
                this.showNotification('add', result);
                this.get()
            }
        })
    }

    public edit(sick_leave): void {
        let dialogRef = this.dialog.open(RegisterSickLeaveComponent, {
            data: {
                s_request: sick_leave
            },
            autoFocus: false,
            disableClose: false,
            minWidth: 400
        });
        dialogRef.afterClosed().subscribe(result => {
            if (result && result != 'cancel') {
                this.showNotification('edit', result);
                this.get()
            }
        })

    }

    public delete(sick_leave): void { //public delete(request: ApiKey): void {
        let message = 'Сигурни ли сте, че желаете да изтриете болничния запис на:';
        message += `<br>${sick_leave.first_name} ${sick_leave.last_name} (${sick_leave.position})`;
        message += `<br> за периода от ${sick_leave.start_date} до ${sick_leave.end_date}?`;
        this.swal_service.confirm({
            html: message
        })
            .then(r => {
                if (r.isConfirmed) {
                    this.sick_leave_service.delete(sick_leave.id).subscribe(result => {
                        if (result) {
                            this.showNotification('danger', sick_leave);
                            this.swal_service.success({text: `Записът беше изтрит.`});
                            this.get();
                        }
                    }, error => {
                        this.swal_service.error({text: 'Възникна грешка при изтриването на болничния запис: ' + error.message});
                    });
                }
            });
    }

    public showProfile(employee_id): void {
    }


    public notifyOngoing(sick_leave): any {
        return (new Date(sick_leave.end_date) > new Date() && new Date(sick_leave.start_date) < new Date()) ?
            'ongoing' : new Date(sick_leave.end_date) > new Date() && new Date(sick_leave.start_date) > new Date() ?
                'future' : null;

        // return (new Date() < new Date(end_date)) ? "text-warning" : null;
    }


    public filtering(event: Event, segment, type): void {
        this.filter[segment][type] = String(event);
        this.updateSumDataNew(segment);
    }

    private updateSumDataNew(segment): void {
        this.summarized[segment].days = 0
        this.summarized[segment].cost = 0
        var costs = document.getElementsByClassName(segment + '-cost');
        var days = document.getElementsByClassName(segment + '-days');

        for (var i = 0, len = costs.length; i < len; i++
        ) {
            this.summarized[segment].cost += parseInt(costs[i].innerHTML)
        }

        for (var i = 0, len = days.length; i < len; i++) {
            this.summarized[segment].days += parseInt(days[i].innerHTML)
        }
    }

    public searching(action: string, segment: string) {
        this.search[segment] = (action === 'start') ? true : false;
        if (action === 'end' || action === 'restart') {
            this.filter[segment] = {
                'first_name': '',
                'last_name': '',
                'position': '',
                'department': '',
                'location': '',
                'end_date': '',
                'start_date': ''
            }
        }
    }

    private onPageChange(event: PageEvent): void {
        this.pagination = event
    }

    public sorting(segment: string, field: string, event ?: Event): void {
        console.log(event)
        console.log(field)
        console.log(event.target)

        this.sort[segment]['field'] = field;
        (this.sort[segment]['action'] === 'descending') ?
            this.sort[segment]['action'] = 'ascending' :
            this.sort[segment]['action'] = 'descending';

        console.log(event)
        console.log(event.target)
    }

    public isSearchable(column: string) {
        return this.searchable.alphabetical.includes(column) && this.searchable.dates.includes(column);
    }

    public isSearchableAlphabetical(column: string) {
        return this.searchable.alphabetical.includes(column)
    }

    public isSearchableDates(column: string) {
        return this.searchable.dates.includes(column)
    }

}
